"use client";
import { useRouter } from "next/navigation";
import { routes } from "@/constants/routes";
import Image from "next/image";

export default function ChooseLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-neutral-100 dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 shadow-xl rounded-2xl p-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          {/* Light mode logo */}
          <div className="relative h-16 w-40 dark:hidden">
            <Image
              src="/icons/stocka-high-resolution-logo-grayscale-transparent.png"
              alt="Stocka Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* Dark mode logo */}
          <div className="relative h-16 w-40 hidden dark:block">
            <Image
              src="/icons/stocka-high-resolution-logo-transparent.png"
              alt="Stocka Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-center text-neutral-800 dark:text-neutral-100 mb-8">
          Choose where to log in
        </h2>

        {/* Buttons */}
        <div className="grid gap-4">
          <button
            onClick={() => router.push(routes.posLogin)}
              className="w-full py-3 rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
         >
            POS
          </button>

          <button
            onClick={() => router.push(routes.backoffice)}
            className="w-full py-3 rounded-lg font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Backoffice
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-8 leading-relaxed">
          By continuing, you agree to our{" "}
          <a
            href="https://www.stocka.solutions/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            Terms of Use
          </a>{" "}
          and{" "}
          <a
            href="https://www.stocka.solutions/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
