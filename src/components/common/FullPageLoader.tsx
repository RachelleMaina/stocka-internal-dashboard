"use client"

import { Loader } from "lucide-react"

export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-800 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-neutral-600 dark:text-neutral-300 font-medium">
          Loading...
        </p>
      </div>
    </div>
  )
}
