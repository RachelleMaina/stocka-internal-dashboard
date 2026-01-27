"use client";

import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSliders,
  FileWarning,
  Sheet,
  Tag,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { Permission } from "@/components/common/Permission";

const BulkUploadErrors = ({ errors }: { errors: string[] }) => {
  const parsedErrors = errors.map((entry) => {
    const [rowPrefix, ...issues] = entry.split(":");
    const rowLabel = rowPrefix.trim();
    const fieldErrors = issues
      .join(":")
      .split(";")
      .map((e) => e.trim())
      .filter(Boolean);
    return { rowLabel, fieldErrors };
  });

  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="bg-primary/10 dark:bg-neutral-800 text-sm space-y-4 ">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400" />
        <div>
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 text-xs">
            Validation issues found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-xs">
            Click on a row to see detailed errors. Fix them and upload again.
          </p>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
        {parsedErrors.map(({ rowLabel, fieldErrors }, i) => {
          const isOpen = expanded[i];
          return (
            <div
              key={i}
              className="bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md"
            >
              <button
                onClick={() => toggleExpand(i)}
                className="w-full flex justify-between items-center px-4 py-2 text-left text-neutral-800 dark:text-neutral-100 font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md"
              >
                <span>
                  {rowLabel} - {fieldErrors.length} issue
                  {fieldErrors.length > 1 ? "s" : ""}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              {isOpen && (
                <ul className="px-6 pb-3 space-y-1 text-xs text-neutral-700 dark:text-neutral-300 list-disc list-inside">
                  {fieldErrors.map((err, j) => (
                    <li key={j}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function BulkUploadForm() {
  const router = useRouter();
  const methods = useForm();
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = methods;

  const [step, setStep] = useState("idle");
  const [uploadErrors, setUploadErrors] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/api/items/download-template", {
        responseType: "blob",
        withCredentials: false,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `items_bulk_upload_template_${new Date().toISOString()}.xlsx`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Failed to download template:", error);
      toast.error("Failed to download template. Please try again.");
    }
  };

  const handleDownloadCatalogue = async () => {
    try {
      const response = await api.get("/api/items/download-catalogue", {
        responseType: "blob",
        withCredentials: false,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `items_bulk_upload_template_${new Date().toISOString()}.xlsx`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    } catch (error) {
      console.error("Failed to download template:", error);
      toast.error("Failed to download template. Please try again.");
    }
  };

  const onSubmit = async (data:any) => {
    const file = data.file?.[0];
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/items/validate-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: false,
      });

      toast.success("File validated successfully");
      setStep("success");

      setValue("file", null);

      setProcessedCount(response.data?.data?.count);
    } catch (error:any) {
      const errorMessages = error.response?.data?.error ||
        error.response?.data?.message || ["Failed to validate file"];
      setUploadErrors(errorMessages);

      setStep("error");
    }
  };

  const resetUpload = () => {
    setStep("idle");
    setValue("file", null);
  };

  return (
     <Permission resource={"items"} action={"excel"} isPage={true}>
    <div className="">
      <BreadcrumbWithActions
        label="Bulk Products"
        breadcrumbs={[
          { name: "Products", onClick: () => router.push(routes.items) },
          { name: "Bulk Products" },
        ]}
        actions={[
          {
            title: "Upload File",
            onClick: handleSubmit(onSubmit),
              icon: <Upload className="w-4 h-4"/>,
            disabled: !watch("file")?.length,
            resource: "items",
            action: "excel"
          },
        ]}
      />

      <div className="p-2">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full mx-auto space-y-3"
          >
            <section className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded p-3 ">
              <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  Download Excel Template
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-md border border-neutral-200 dark:border-neutral-600 bg-primary/10 dark:bg-neutral-800 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Sheet className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        Bulk Upload Template
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      Download the official template with all required columns
                      pre-filled for a smooth upload.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-medium border border-primary text-primary"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>

                {/* Item Catalogue Card */}
                <div className="rounded border border-neutral-200 dark:border-neutral-600 bg-primary/10 dark:bg-neutral-800 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                        Product Catalogue
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      Export a copy of your current inventory. Use it to make
                      bulk edits and re-upload.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleDownloadCatalogue}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-medium border border-primary text-primary"
                    >
                      <Download className="w-4 h-4" />
                      Download Catalogue
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {step === "idle" && (
              <section className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md p-3 space-y-6 ">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                  <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    Upload Excel File
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Select File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".xls,.xlsx"
                      {...register("file", {
                        required: "Please upload a file.",
                        onChange: (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setStep("idle");
                          } else {
                          }
                        },
                      })}
                                              className="mt-1 block w-full text-xs text-neutral-600 dark:text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neutral-100 file:text-neutral-800"
                      />
                    {errors.file && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.file.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!watch("file")?.length}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-neutral-100   disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
              </section>
            )}
            {step !== "idle" && (
              <section className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md p-3 space-y-4 ">
                {step === "error" && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileSliders className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                        <h2 className="txt-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          Review and Confirm
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        <button
                          onClick={resetUpload}
                          type="button"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Re-upload File
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {uploadErrors && uploadErrors?.length > 0 && (
                        <BulkUploadErrors errors={uploadErrors} />
                      )}
                    </div>
                  </>
                )}

                {step === "success" && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                        <h2 className="txt-sm font-semibold text-neutral-800 dark:text-neutral-100">
                          Success
                        </h2>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">
                        Success! We’ve processed{" "}
                        <strong>{processedCount}</strong> item
                        {processedCount !== 1 && "s"} from your upload. You can
                        now view them in your product list.
                      </p>

                      <div className="flex items-center gap-2">
                        <ChevronLeft className="w-5 h-5 text-primary" />
                        <button
                          onClick={() => router.push(routes.itemsList)}
                          type="button"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          View Products
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            )}
          </form>
        </FormProvider>
      </div>
      </div>
      </Permission>
  );
}
