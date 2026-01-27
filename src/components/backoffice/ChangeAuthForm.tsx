"use client";
import { generateRandomPassword, generateRandomPin } from "@/lib/utils/helpers";
import { RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import ModalHeader from "../common/ModalHeader";
import NeutralButton from "../common/NeutralButton";
import PrimaryButton from "../common/PrimaryButton";

interface ChangeUserPasswordModalProps {
  userType: "backoffice" | "pos";
  onSave: (payload: { password?: string; pin?: string }) => void;
  onClose: () => void;
}

const ChangeUserPasswordModal: React.FC<ChangeUserPasswordModalProps> = ({
  userType,
  onSave,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const handleFormSubmit = (data: any) => {
    if (userType === "backoffice" && !data.password) {
      toast.error("Password is required");
      return;
    }
    if (userType === "pos" && !data.pin) {
      toast.error("PIN is required");
      return;
    }

    onSave({
      password: data.password,
      pin: data.pin,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-900 p-6 m-3 rounded-lg w-full max-w-md shadow-lg">
        <ModalHeader title="Change User Credentials" onClose={onClose} />
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        

          {userType === "backoffice" ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Password
                </label>
                <input
                  {...register("password")}
                  type="text"
                  placeholder="Enter password"
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
                className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 mt-6"
                title="Generate Password"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  PIN
                </label>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      id={`pin_${index}`}
                      placeholder="0"
                      className="w-12 h-12 text-center border border-neutral-300 dark:border-neutral-600 rounded-md text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      {...register(`pin_${index}`, {
                        onChange: (e) => {
                          const value = e.target.value;
                          if (value.length === 1 && index < 3) {
                            document.getElementById(`pin_${index + 1}`)?.focus();
                          }
                          const pin = [0, 1, 2, 3]
                            .map(
                              (i) =>
                                (
                                  document.getElementById(
                                    `pin_${i}`
                                  ) as HTMLInputElement
                                )?.value || ""
                            )
                            .join("");
                          setValue("pin", pin.length === 4 ? pin : "");
                        },
                      })}
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
                className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 mt-6"
                title="Generate PIN"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <NeutralButton onClick={onClose}>Cancel</NeutralButton>
            <PrimaryButton type="submit">Save</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeUserPasswordModal;
