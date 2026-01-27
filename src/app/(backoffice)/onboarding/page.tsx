"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/constants/routes";
import { CheckCircle, Circle, UserPlus, Package, Users, Smartphone, ShoppingCart, CreditCard, Upload, LayoutDashboard } from "lucide-react";
import toast from "react-hot-toast";

const onboardingSteps = [
  {
    id: 1,
    title: "Register Your Account",
    description: "Create an account for your business to get started with Stocker.",
    icon: UserPlus,
    action: { label: "Go to Register", route: routes.register },
  },
  {
    id: 2,
    title: "Set Up Products",
    description: "Create units of measure, categories, and add your products.",
    icon: Package,
    action: { label: "Go to Products", route: routes.items },
  },
  {
    id: 3,
    title: "Add Staff",
    description: "Create a user with type 'POS' and assign the 'POS Admin' role.",
    icon: Users,
    action: { label: "Go to Staff", route: "/people/staff" },
  },
  {
    id: 4,
    title: "Register Device",
    description: "Add a device (e.g., 'My Phone') and copy the device key.",
    icon: Smartphone,
    action: { label: "Go to Devices", route: "/devices" },
  },
  {
    id: 5,
    title: "Connect POS",
    description: "Navigate to POS and enter the device key to activate it.",
    icon: ShoppingCart,
    action: { label: "Go to POS", route: "/pos" },
  },
  {
    id: 6,
    title: "Make a Sale",
    description: "Search for an item to sell and click 'Charge' to complete a sale.",
    icon: CreditCard,
    action: { label: "Go to POS", route: "/pos" },
  },
  {
    id: 7,
    title: "Sync Sales",
    description: "Go to 'My Sales' and click 'Sync All' to update your records.",
    icon: Upload,
    action: { label: "Go to My Sales", route: "/my-sales" },
  },
  {
    id: 8,
    title: "Review in Backoffice",
    description: "Return to the Backoffice to view the sale you made.",
    icon: LayoutDashboard,
    action: { label: "Go to Backoffice", route: routes.backoffice },
  },
  {
    id: 9,
    title: "You're All Set!",
    description: "Your POS system is ready to use. Start selling with Stocker!",
    icon: CheckCircle,
    action: { label: "Explore Dashboard", route: routes.backoffice },
  },
];

const OnboardingPage: React.FC = () => {
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const storedSteps = JSON.parse(localStorage.getItem("onboardingSteps") || "[]");
    setCompletedSteps(storedSteps);
  }, []);

  const handleCompleteStep = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      const updatedSteps = [...completedSteps, stepId];
      setCompletedSteps(updatedSteps);
      localStorage.setItem("onboardingSteps", JSON.stringify(updatedSteps));
      toast.success(`Step ${stepId} completed!`);
    }
  };

  const handleAction = (route: string, stepId: number) => {
    router.push(route);
    // Optionally mark as complete on navigation
    // handleCompleteStep(stepId);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-50 dark:bg-neutral-900 px-4">
      <div className="text-center mb-10">
        <h1
          className="text-4xl font-bold text-neutral-800 dark:text-neutral-100"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Stocker
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
          POS and Inventory Management Platform
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-neutral-800 shadow-lg rounded-xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-center text-neutral-800 dark:text-neutral-100 mb-4">
          Get Started with Stocker
        </h2>
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Complete these steps to set up your POS system. ({completedSteps.length}/{onboardingSteps.length} completed)
        </p>

        <div className="space-y-4">
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start p-4 rounded-lg border ${
                completedSteps.includes(step.id)
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-neutral-200 dark:border-neutral-600"
              }`}
            >
              <div className="flex-shrink-0 mr-4">
                {completedSteps.includes(step.id) ? (
                  <CheckCircle className="w-6 h-6 text-indigo-500" />
                ) : (
                  <Circle className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  {step.description}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAction(step.action.route, step.id)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-500 hover:bg-primary rounded-md transition"
                  >
                    {step.action.label}
                  </button>
                  {!completedSteps.includes(step.id) && (
                    <button
                      onClick={() => handleCompleteStep(step.id)}
                      className="px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded-md transition"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;