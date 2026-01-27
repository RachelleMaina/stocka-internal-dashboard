"use client";

import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import PhoneInput from "react-phone-number-input";
import Select from "react-select";

interface RegisterFormData {
  location_name: string;
  business_type: { value: string; label: string } | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  password: string;
  confirm_password: string;
}

const registerSchema = Joi.object({
  location_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .label("Business Name")
    .messages({
      "string.base": "Business Name must be a string.",
      "string.empty": "Business Name is required.",
      "string.min": "Business Name should have at least 2 characters.",
      "string.max": "Business Name should not exceed 100 characters.",
      "any.required": "Business Name is required.",
    }),
  business_type: Joi.object({
    value: Joi.string().valid("Retail").required(),
    label: Joi.string().required(),
  })
    .required()
    .label("Business Type")
    .messages({
      "any.required": "Business Type is required.",
      "object.base": "Business Type is required.",
    }),
  first_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .label("First Name")
    .messages({
      "string.base": "First Name must be a string.",
      "string.empty": "First Name is required.",
      "string.min": "First Name should have at least 2 characters.",
      "string.max": "First Name should not exceed 50 characters.",
      "any.required": "First Name is required.",
    }),
  last_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .label("Last Name")
    .messages({
      "string.base": "Last Name must be a string.",
      "string.empty": "Last Name is required.",
      "string.min": "Last Name should have at least 2 characters.",
      "string.max": "Last Name should not exceed 50 characters.",
      "any.required": "Last Name is required.",
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .allow(null)
    .optional()
    .label("Email")
    .messages({
      "string.email": "Email must be a valid email address.",
    }),
  phone: Joi.string().required().label("Phone").messages({
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
  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .label("Confirm Password")
    .messages({
      "any.only": "Passwords do not match.",
      "any.required": "Confirm Password is required.",
    }),
});

const businessTypeOptions = [{ value: "Retail", label: "Retail" }];

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { dispatch } = useAppState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  //   useEffect(() => {
  //   const html = document.documentElement;
  //   const storedTheme = localStorage.getItem("theme");
  //   const prefersDark = window.matchMedia(
  //     "(prefers-color-scheme: dark)"
  //   ).matches;
  //   const isDark = storedTheme === "dark" || (!storedTheme && prefersDark);

  //   html.classList.toggle("dark", isDark);
  // }, []);

  const methods = useForm<RegisterFormData>({
    resolver: joiResolver(registerSchema),
    defaultValues: {
      location_name: "",
      business_type: null,
      first_name: "",
      last_name: "",
      email: null,
      phone: "",
      password: "",
      confirm_password: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    control,
  } = methods;

const onSubmit = async (data: RegisterFormData) => {
  setIsSubmitting(true);
  try {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone,
      password: data.password,
      location_name: data.location_name,
      business_type: data.business_type?.value || "Retail",
    };

     await api.post("/api/business-locations", payload);

   
    router.push(routes.backofficeLogin);
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to register.");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleNext = () => {
    methods.trigger(["location_name", "business_type"]).then((isValid) => {
      if (isValid) {
        setStep(2);
      }
    });
  };

  const handleBack = () => {
    setStep(1);
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
        <h2 className="text-xl font-bold text-center text-neutral-800 dark:text-neutral-100 mb-6">
          Create Account
        </h2>

        {/* Step Indicator */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 font-semibold rounded-full flex items-center justify-center ${
                step === 1
                  ? "bg-primary text-white"
                  : "bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-100"
              }`}
            >
              1
            </div>
            <div className="w-12 h-1 bg-neutral-200 dark:bg-neutral-600">
              <div
                className={`h-full ${
                  step === 2
                    ? "bg-primary"
                    : "bg-neutral-200 dark:bg-neutral-600"
                }`}
              ></div>
            </div>
            <div
              className={`w-8 h-8 font-semibold rounded-full flex items-center justify-center ${
                step === 2
                  ? "bg-primary text-white"
                  : "bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-100"
              }`}
            >
              2
            </div>
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label
                    htmlFor="location_name"
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                  >
                    Business Name
                  </label>
                  <input
                    id="location_name"
                    {...register("location_name")}
                    className="mt-1 w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {errors.location_name && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.location_name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="business_type"
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                  >
                    Business Type
                  </label>
                  <Controller
                    name="business_type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={businessTypeOptions}
                        className="my-react-select-container"
                        classNamePrefix="my-react-select"
                      />
                    )}
                  />
                  {errors.business_type && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.business_type.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`w-full py-2.5 rounded transition font-semibold ${
                    isSubmitting
                      ? "cursor-not-allowed"
                      : "bg-primary hover:bg-primary text-white"
                  }`}
                >
                  Next
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                    >
                      First Name
                    </label>
                    <input
                      id="first_name"
                      {...register("first_name")}
                      className="mt-1 w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    {errors.first_name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.first_name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                    >
                      Last Name
                    </label>
                    <input
                      id="last_name"
                      {...register("last_name")}
                      className="mt-1 w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    {errors.last_name && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.last_name.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    className="mt-1 w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                  >
                    Phone
                  </label>
                  <PhoneInput
                    country="KE"
                    international
                    defaultCountry="KE"
                    value={watch("phone")}
                    onChange={(val) => setValue("phone", val || "")}
                    className="w-full text-sm text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-600 rounded px-3 
                      [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-r-md 
                      [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:bg-white dark:[&_.PhoneInputInput]:bg-neutral-800
                      [&_.PhoneInputInput]:border-l
                      [&_.PhoneInputInput]:border-neutral-300 dark:[&_.PhoneInputInput]:border-neutral-600
                      [&_.PhoneInputInput]:focus:outline-none 
                      [&_.PhoneInput]:flex [&_.PhoneInput]:rounded [&_.PhoneInput]:border [&_.PhoneInput]:border-neutral-300 dark:[&_.PhoneInput]:border-neutral-600 [&_.PhoneInput]:bg-white dark:[&_.PhoneInput]:bg-neutral-800"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="mt-1 w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-neutral-900 dark:text-neutral-300"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm_password"
                    type="password"
                    {...register("confirm_password")}
                    className="mt-1 w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-1/2 py-2 rounded transition font-semibold bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-neutral-500"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-1/2 py-2 rounded transition font-semibold ${
                      isSubmitting
                        ? "bg-primary cursor-not-allowed"
                        : "bg-primary hover:bg-primary text-white"
                    }`}
                  >
                    {isSubmitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </>
            )}
          </form>
        </FormProvider>

        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-4">
          Already have an account?{" "}
          <a
            href="/"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
