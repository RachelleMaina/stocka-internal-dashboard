"use client";

import { endpoints } from "@/constants/endpoints";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import PhoneInput from "react-phone-number-input";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const schema = Joi.object({
  identifier: Joi.string().required().label("Phone").messages({
    "string.base": "Phone number must be a string of digits.",
    "string.empty": "Phone number is required.",
    "any.required": "Phone number is required.",
  }),
  password: Joi.string().min(4).required().label("Password").messages({
    "string.base": "Password must be a text value.",
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 4 characters.",
    "any.required": "Password is required.",
  }),
});

interface FormData {
  identifier: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { user_profile, dispatch, hasCheckedAuth } = useAppState();
  const queryClient = useQueryClient();

  const methods = useForm<FormData>({
    resolver: joiResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = methods;

  // 1. Login mutation (server sets HttpOnly cookie)
  const loginMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      const response = await api.post(endpoints.login, payload);
   
      return response.data;
    },
    onSuccess: async () => {
      // 2. Immediately fetch full profile using the cookie (auto-sent by browser)
      const profileResponse = await api.get(endpoints.me); // ← /me endpoint
      const user_profile = profileResponse.data?.data;

      dispatch({
        type: "LOGIN",
        user_profile: user_profile,
      });

      // Optional: cache profile in localStorage (non-sensitive parts only!)
      localStorage.setItem("user_profile", JSON.stringify(user_profile));

      toast.success("Logged in.");
      router.push(routes.backoffice);

      // Invalidate any cached profile queries
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to login.");
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (hasCheckedAuth && user_profile) {
      router.push(routes.backoffice);
    }
  }, [router, user_profile, hasCheckedAuth]);

  const onLogin = (data: FormData) => {
    data.app_context = "internal"
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center md:bg-primary/10 bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-800 shadow-lg rounded-xl p-6">
        <div className="text-center my-4">
          <h1 className="text-3xl font-bold text-black dark:text-neutral-100 tracking-[-1px]">
            Stocka
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 ">
            POS and Inventory Management Solution.
          </p>
        </div>

        <h2 className="text-xl font-bold text-center text-neutral-800 dark:text-neutral-100 mb-2">
          Sign in to your Account
        </h2>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onLogin)} className="space-y-6">
            <div className="flex flex-col gap-5">
              <div className="w-full">
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                >
                  Phone
                </label>

                <PhoneInput
                  country="KE"
                  international
                  defaultCountry="KE"
                  value={watch("identifier")}
                  onChange={(val) => setValue("identifier", val || "")}
                  className="w-full text-sm text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded px-3 
                    [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-r-md 
                    [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:bg-white dark:[&_.PhoneInputInput]:bg-neutral-800
                    [&_.PhoneInputInput]:border-l
                    [&_.PhoneInputInput]:border-neutral-300 dark:[&_.PhoneInputInput]:border-neutral-600
                    [&_.PhoneInputInput]:focus:outline-none 
                    [&_.PhoneInput]:flex [&_.PhoneInput]:rounded-md [&_.PhoneInput]:border [&_.PhoneInput]:border-neutral-300 dark:[&_.PhoneInput]:border-neutral-600 [&_.PhoneInput]:bg-white dark:[&_.PhoneInput]:bg-neutral-800"
                />

                {errors.identifier && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              <div className="w-full">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-neutral-900 dark:text-neutral-300 mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  {...methods.register("password")}
                  className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter your password"
                  required
                />
                {methods.formState.errors.password?.message && (
                  <p className="mt-1 text-sm text-red-500">
                    {methods.formState.errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending || isSubmitting}
              className={`w-full py-2 rounded transition font-semibold ${
                loginMutation.isPending || isSubmitting
                  ? "bg-primary cursor-not-allowed"
                  : "bg-primary hover:bg-primary text-white"
              }`}
            >
              {loginMutation.isPending || isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default LoginPage;