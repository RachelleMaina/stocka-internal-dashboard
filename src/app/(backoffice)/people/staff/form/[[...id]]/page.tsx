"use client";

import PageSkeleton from "@/components/common/PageSkeleton";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Clock3, Lock, RefreshCw, UserRound } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Select from "react-select";
import PhoneInput from "react-phone-number-input";
import {
  generateColor,
  generateDisplayName,
  generateRandomPassword,
  generateRandomPin,
} from "@/lib/utils/helpers";
import { User } from "@/types/report";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import FloatingInput from "@/components/common/FloatingInput";
import { routes } from "@/constants/routes";
import { Permission } from "@/components/common/Permission";
import clsx from "clsx";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type UserType = "pos" | "backoffice";

type FormValues = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  email: string;
  color_hex: string;
  role_id: string;
  store_location_ids: string;
  user_type: UserType;
  password?: string;
  pin?: string;
  working_hours:
    | null
    | {
        day: string;
        start: string;
        end: string;
        is_enabled: boolean;
      }[];
};

const schema = Joi.object<FormValues>({
  first_name: Joi.string().required().messages({
    "string.base": "First name must be a string",
    "string.empty": "First name is required",
    "any.required": "First name is required",
  }),

  last_name: Joi.string().required().messages({
    "string.base": "Last name must be a string",
    "string.empty": "Last name is required",
    "any.required": "Last name is required",
  }),

  display_name: Joi.string().required().messages({
    "string.base": "Display name must be a string",
    "string.empty": "Display name is required",
    "any.required": "Display name is required",
  }),

  email: Joi.string().email({ tlds: false }).optional().allow("").messages({
    "string.email": "Please enter a valid email address",
    "string.base": "Email must be a string",
  }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/) // E.164 international format
    .optional()
    .allow("")
    .messages({
      "string.pattern.base":
        "Phone number must be in international format (e.g., +1234567890)",
      "string.base": "Phone number must be a string",
    }),

  color_hex: Joi.string()
    .regex(/^#[0-9A-F]{6}$/i)
    .required()
    .messages({
      "string.base": "Color must be a string",
      "string.pattern.base": "Color must be a valid hex code (e.g., #FF0000)",
      "string.empty": "Color is required",
      "any.required": "Color is required",
    }),

  role_id: Joi.string().allow("", null).messages({
    "string.base": "Role ID must be a string",
  }),

  store_location_ids: Joi.array()
    .items(
      Joi.string().uuid().messages({
        "string.base": "Each store location ID must be a string",
        "string.uuid": "Each store location ID must be a valid UUID",
      })
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Store locations must be an array",
      "array.min": "At least one store location is required",
      "array.empty": "At least one store location is required",
      "any.required": "Store locations are required",
    }),

  user_type: Joi.string().valid("pos", "backoffice").required().messages({
    "string.base": "User type must be a string",
    "any.only": "User type must be either 'pos' or 'backoffice'",
    "string.empty": "User type is required",
    "any.required": "User type is required",
  }),

  pin: Joi.when("user_type", {
    is: "pos",
    then: Joi.string()
      .length(4)
      .pattern(/^\d{4}$/)
      .required()
      .messages({
        "string.base": "PIN must be a string",
        "string.length": "PIN must be exactly 4 digits",
        "string.pattern.base": "PIN must be 4 digits (e.g., 1234)",
        "string.empty": "PIN is required for POS users",
        "any.required": "PIN is required for POS users",
      }),
    otherwise: Joi.any().strip(),
  }),

  pin_0: Joi.any().strip(),
  pin_1: Joi.any().strip(),
  pin_2: Joi.any().strip(),
  pin_3: Joi.any().strip(),

  password: Joi.when("user_type", {
    is: "backoffice",
    then: Joi.string().min(4).allow("", null).messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 4 characters long",
    }),
    otherwise: Joi.any().strip(),
  }),

  working_hours: Joi.alternatives()
    .try(
      Joi.array()
        .items(
          Joi.object({
            day: Joi.string().required().messages({
              "string.base": "Day must be a string",
              "string.empty": "Day is required for working hours",
              "any.required": "Day is required for working hours",
            }),
            start: Joi.string().allow("").optional().messages({
              "string.base": "Start time must be a string",
            }),
            end: Joi.string().allow("").optional().messages({
              "string.base": "End time must be a string",
            }),
            is_enabled: Joi.boolean().required().messages({
              "boolean.base": "Enabled status must be a boolean",
              "any.required": "Enabled status is required for working hours",
            }),
          })
        )
        .length(7)
        .messages({
          "array.base": "Working hours must be an array",
          "array.length": "Working hours must include exactly 7 days",
        }),
      Joi.valid(null)
    )
    .optional()
    .messages({
      "alternatives.types":
        "Working hours must be an array of 7 day objects or null",
    }),
}).options({ stripUnknown: true });

const UserForm = () => {
  const [userType, setUserType] = useState<string | null>(null);
  const [userOptions, setUserOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [user, setUser] = useState<FormValues | null>(null);

  const { business_profile } = useAppState();
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const methods = useForm<FormValues>({
    resolver: joiResolver(schema),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = methods;

  const firstName = watch("first_name");
  const lastName = watch("last_name");
  const roleId = watch("role_id");
  //   const userType = watch("user_type");
  const workingHours = watch("working_hours");

  useEffect(() => {
    register("pin");
  }, [register]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!userType) return;

      setLoadingRoles(true);
      try {
        const response = await api.get(`/api/roles`, {
          params: { role_type: userType },
        });
        const data = response.data.data;

        const options = data.map((role: any) => ({
          label: `${role.role_name} (${role.role_type})`,
          value: role.id,
        }));

        setUserOptions(options);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, [userType]);

  useEffect(() => {
    if (!user) return;
    setUserType(user.user_type);

    reset({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      display_name:
        user.display_name || `${user.first_name || ""} ${user.last_name || ""}`,
      role_id: user.role_id || "",
      store_location_ids: user.store_location_ids || "",
      user_type: user.user_type || "pos",
      color_hex: user.color_hex || "#4B5EAA",
      pin: user.user_type === "pos" ? user.pin || "" : undefined,
      password: user.user_type === "backoffice" ? "" : undefined,
      working_hours:
        Array.isArray(user.working_hours) && user.working_hours.length === 7
          ? user.working_hours
          : daysOfWeek.map((day) => ({
              day,
              start: "09:00",
              end: "17:00",
              is_enabled: false,
            })),
    });
  }, [user, reset]);

  // Auto-set display name and color
  useEffect(() => {
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    if (fullName) {
      setValue("display_name", generateDisplayName(firstName, lastName));
      setValue("color_hex", generateColor());
    }
  }, [firstName, lastName, setValue]);

  useEffect(() => {
    if (id) {
      fetchUser();
    } else setLoading(false);
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/api/users/${id}`);
      const user = response.data.data;
      setUser(user);
      setLoading(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load user");
      setLoading(false); // Set loading to false even on error
    }
  };

  const handleSaveUser = async (payload: User) => {
    setOperationLoading(true);
    if (id) {
      try {
        await api.patch(`/api/users/${user.id}`, payload);
        toast.success("User updated.");
        router.push(routes.staff);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to update user.");
      } finally {
        setOperationLoading(false);
      }
    } else {
      try {
        await api.post(`/api/users`, payload);
        toast.success("User created.");
        router.push(routes.staff);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to create user.");
      } finally {
        setOperationLoading(false);
      }
    }
  };

  const storeLocationOptions = business_profile?.map((location) => ({
    value: location.store_location_id || location.id,
    label:
      location.store_location_name ||
      location.location_name + (location.is_default ? "(Main)" : ""),
  }));

  const getSelectedOptions = (ids: any) => {
    return storeLocationOptions.filter((option) => ids?.includes(option.value));
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Permission resource={"users"} action={id ? "update" : "create"} isPage={true}>
      <div className="">
        <BreadcrumbWithActions
          label={id ? "Edit User" : "Add User"}
          breadcrumbs={[
            { name: "People", onClick: () => router.push(routes.people) },
            { name: "Users", onClick: () => router.push(routes.staff) },
            {
              name: id
                ? `${user?.first_name} ${user?.last_name}`
                : "Add New User",
            },
          ]}
          actions={[
            {
              title: "Save Changes",
              onClick: handleSubmit(handleSaveUser),
              resource: "users",
              action: "update",
            },
          ]}
        />
      <div className="p-3 bg-white dark:bg-neutral-800">
  <FormProvider {...methods}>
    <form className="w-full max-w-[460px] md:w-full mx-auto space-y-3">
      {/* Personal Info */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-4">
            <div>
              <FloatingInput
                backgroundClass="bg-white dark:bg-neutral-800"
                id="first_name"
                label="First Name"
                required
                register={register("first_name")}
                error={errors.first_name?.message}
              
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div>
              <FloatingInput
                backgroundClass="bg-white dark:bg-neutral-800"
                id="last_name"
                label="Last Name"
                required
                register={register("last_name")}
                error={errors.last_name?.message}
              
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.last_name.message}
                </p>
              )}
            </div>
            <div>
              <FloatingInput
                backgroundClass="bg-white dark:bg-neutral-800"
                id="email"
                label="Email"
                register={register("email")}
                error={errors.email?.message}
              
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <PhoneInput
                country="KE"
                international
                defaultCountry="KE"
                value={watch("phone")}
                onChange={(val) => setValue("phone", val || "")}
                className="w-full text-sm text-neutral-900 dark:text-neutral-100 border-2 border-neutral-300 dark:border-neutral-600 rounded px-3 [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-r-md [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:bg-white dark:[&_.PhoneInputInput]:bg-neutral-800 [&_.PhoneInputInput]:border-l [&_.PhoneInputInput]:border-neutral-300 dark:[&_.PhoneInputInput]:border-neutral-700 [&_.PhoneInputInput]:focus:outline-none [&_.PhoneInput]:flex [&_.PhoneInput]:rounded-md [&_.PhoneInput]:border-2 [&_.PhoneInput]:border-neutral-300 dark:[&_.PhoneInput]:border-neutral-700 [&_.PhoneInput]:bg-white dark:[&_.PhoneInput]:bg-neutral-800"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-4 flex">
            <div>
              <div className="flex items-center gap-2">
                <FloatingInput
                  backgroundClass="bg-white dark:bg-neutral-800"
                  id="display_name"
                  label="Display Name"
                  required
                  register={register("display_name")}
                  error={errors.display_name?.message}
                
                />
                <div
                  className="w-9 h-9 rounded border-2 border-neutral-300 dark:border-neutral-600"
                  style={{ backgroundColor: watch("color_hex") }}
                />
                <button
                  type="button"
                  onClick={() => setValue("color_hex", generateColor())}
                  className="p-2 text-neutral-900 bg-neutral-200 dark:text-neutral-400 dark:bg-neutral-700 transition rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  title="Regenerate Color"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {errors.display_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.display_name.message}
                </p>
              )}
              {errors.color_hex && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.color_hex.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Access Settings */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Access Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!user && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                User Type
              </label>
              <Select
                options={[
                  { label: "Backoffice", value: "backoffice" },
                  { label: "POS", value: "pos" },
                ]}
                value={[
                  { label: "Backoffice", value: "backoffice" },
                  { label: "POS", value: "pos" },
                ].find((opt) => opt.value === watch("user_type"))}
                onChange={(val) => {
                  if (val) {
                    setValue("user_type", val.value as UserType);
                    setUserType(val.value);
                    setValue("role_id", null);
                  }
                }}
                placeholder="User Type"
                className="my-react-select-container text-sm"
                classNamePrefix="my-react-select"
                isClearable
              />
              {errors.user_type && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.user_type.message}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Location
            </label>
            <Select
              isMulti
              options={storeLocationOptions}
              value={getSelectedOptions(watch("store_location_ids"))}
              onChange={(selectedOptions) => {
                const selectedIds = selectedOptions
                  ? selectedOptions.map((option) => option.value)
                  : [];
                setValue("store_location_ids", selectedIds, {
                  shouldDirty: true,
                });
              }}
              placeholder="Select Location"
              className="my-react-select-container text-sm"
              classNamePrefix="my-react-select"
              isClearable
            />
            {errors.store_location_ids && (
              <p className="text-red-500 text-sm mt-1">
                {errors.store_location_ids.message}
              </p>
            )}
          </div>
          {userType && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Role
              </label>
              <Select
                options={userOptions}
                value={userOptions.find((opt) => opt.value === roleId) || null}
                onChange={(val) => val && setValue("role_id", val.value)}
                placeholder="Select User"
                className="my-react-select-container text-sm"
                classNamePrefix="my-react-select"
                isLoading={loadingRoles}
              />
              {errors.role_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.role_id.message}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Authentication */}
      {!user && (
        <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
          <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
            Authentication
          </h2>
          {userType === "backoffice" ? (
            <div className="flex items-center gap-2">
              <div className="">
                <FloatingInput
                  backgroundClass="bg-white dark:bg-neutral-800"
                  id="password"
                  label="Password"
                  required
                  register={register("password")}
                  error={errors.password?.message}
                
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setValue("password", generateRandomPassword())}
                className="p-2 text-neutral-900 bg-neutral-200 dark:text-neutral-400 dark:bg-neutral-700 transition rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                title="Generate Password"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Pin
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      placeholder="0"
                      className="w-12 h-12 text-center border-2 border-neutral-300 dark:border-neutral-600 rounded-md px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      {...register(`pin_${index}`, {
                        onChange: (e) => {
                          const value = e.target.value;
                          if (value.length === 1 && index < 3) {
                            document.getElementById(`pin_${index + 1}`)?.focus();
                          }
                          const pin = [0, 1, 2, 3]
                            .map(
                              (i) =>
                                (document.getElementById(`pin_${i}`) as HTMLInputElement)?.value || ""
                            )
                            .join("");
                          setValue("pin", pin.length === 4 ? pin : "");
                        },
                      })}
                      id={`pin_${index}`}
                    />
                  ))}
                </div>
                {errors.pin && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.pin.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const pin = generateRandomPin();
                  setValue("pin", pin);
                  [0, 1, 2, 3].forEach((i) => {
                    const input = document.getElementById(`pin_${i}`) as HTMLInputElement;
                    if (input) input.value = pin[i];
                  });
                }}
                className="mt-6 p-2 text-neutral-900 bg-neutral-200 dark:text-neutral-400 dark:bg-neutral-700 transition rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                title="Generate Pin"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Working Hours */}
      <section className="border-b border-neutral-200 dark:border-neutral-600 pb-6 space-y-2">
        <h2 className="font-semibold text-sm text-neutral-800 dark:text-neutral-100">
          Working Hours
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Array.isArray(watch("working_hours"))}
              onChange={(e) => {
                if (e.target.checked) {
                  setValue(
                    "working_hours",
                    daysOfWeek.map((day) => ({
                      day,
                      start: "09:00",
                      end: "17:00",
                      is_enabled: true,
                    }))
                  );
                } else {
                  setValue("working_hours", null);
                }
              }}
              className="h-6 w-6 rounded border-neutral-300 dark:border-neutral-600 accent-primary dark:accent-primary"
              aria-label="Restrict working hours"
            />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Restrict Working Hours
            </span>
          </label>
          {workingHours && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={workingHours.every((wh) => wh.is_enabled)}
                onChange={(e) => {
                  const updatedHours = workingHours.map((wh) => ({
                    ...wh,
                    is_enabled: e.target.checked,
                  }));
                  setValue("working_hours", updatedHours);
                }}
                className="h-6 w-6 rounded border-neutral-300 dark:border-neutral-600 accent-primary dark:accent-primary"
                aria-label="Select all days"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Select All
              </span>
            </label>
          )}
        </div>
        {workingHours && (
          <div className="space-y-1">
            {daysOfWeek.map((day, idx) => (
              <div key={day} className="flex items-center gap-2 p-3">
                <label className="w-12 text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">
                  {day}
                </label>
                <input
                  type="checkbox"
                  checked={workingHours[idx].is_enabled}
                  onChange={(e) => {
                    const updatedHours = [...workingHours];
                    updatedHours[idx].is_enabled = e.target.checked;
                    setValue("working_hours", updatedHours);
                  }}
                  className="h-6 w-6 rounded border-neutral-300 dark:border-neutral-600 accent-primary dark:accent-primary"
                  aria-label={`Enable working hours for ${day}`}
                />
                <input
                  type="time"
                  {...register(`working_hours.${idx}.start`)}
                  disabled={!workingHours[idx].is_enabled}
                  className="w-28 text-sm rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-600 px-1 py-0.5 text-neutral-900 dark:text-neutral-100 disabled:bg-neutral-100 dark:disabled:bg-neutral-700 focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  to
                </span>
                <input
                  type="time"
                  {...register(`working_hours.${idx}.end`)}
                  disabled={!workingHours[idx].is_enabled}
                  className="w-28 text-sm rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-600 px-1 py-0.5 text-neutral-900 dark:text-neutral-100 disabled:bg-neutral-100 dark:disabled:bg-neutral-700 focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
              </div>
            ))}
          </div>
        )}
        {!workingHours && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No restrictions applied.
          </p>
        )}
        {errors.working_hours && (
          <p className="text-red-500 text-sm mt-2">
            {errors.working_hours.message}
          </p>
        )}
      </section>

      {/* Action Buttons */}
      <section className="p-3">
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Permission resource="users" action={id ? "update" : "create"}>
            <button
              type="button"
              onClick={handleSubmit(handleSaveUser)}
              disabled={operationLoading}
              className={clsx(
                "px-4 py-1.5 bg-primary text-white text-sm font-medium rounded",
                "disabled:cursor-not-allowed",
                "sm:w-auto w-full"
              )}
            >
              Save Changes
            </button>
          </Permission>
        </div>
      </section>
    </form>
  </FormProvider>
</div>
      </div>
    </Permission>
  );
};

export default UserForm;
