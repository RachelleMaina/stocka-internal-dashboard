"use client";

import PageHeader from "@/components/common/PageHeader";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { useBulkCreateItems, useItemOptions } from "@/hooks/useItems";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-hot-toast";
import Select from "react-select";

type FormData = {
  items: Array<{
    brand_name: string;
    item_name: string;
    product_type_code: { label: string; value: string } | null;
    tax_type_code: { label: string; value: string } | null;
    is_purchased: boolean;
    is_sold: boolean;
    is_made_here: boolean;
    tracks_stock: boolean;
  }>;
};

const COLUMNS = [
  { key: "row_number", label: "#" },
  { key: "brand_name", label: "Brand Name" },
  { key: "item_name", label: "Item Name" },
  { key: "product_type", label: "Product Type" },
  { key: "tax_type", label: "Tax Type" },
  { key: "is_purchased", label: "Purchased", align: "center" as const },
  { key: "is_sold", label: "Sold", align: "center" as const },
  { key: "is_made_here", label: "Made Here", align: "center" as const },
  { key: "tracks_stock", label: "Tracks Stock", align: "center" as const },
];

const SELECT_MIN_WIDTH = "180px";

const AddBulkItemsPage = () => {
  const router = useRouter();
  const { data: options, isLoading: loadingOptions } = useItemOptions();
  const bulkCreate = useBulkCreateItems();

  const [search, setSearch] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      items: Array(10)
        .fill(null)
        .map(() => ({
          brand_name: "",
          item_name: "",
          product_type_code: null,
          tax_type_code: null,
          is_purchased: false,
          is_sold: false,
          is_made_here: false,
          tracks_stock: false,
        })),
    },
  });

  const items = useWatch({ control, name: "items" });

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(
      (item) =>
        item.brand_name?.toLowerCase().includes(lowerSearch) ||
        item.item_name?.toLowerCase().includes(lowerSearch)
    );
  }, [items, search]);

  // useEffect(() => {
  //   items.forEach((item, index) => {
  //     if (!item?.product_type_code?.value) return;

  //     const code = item.product_type_code.value;

  //     let desired = {
  //       tracks_stock: item.tracks_stock,
  //       is_purchased: item.is_purchased,
  //       is_made_here: item.is_made_here,
  //       is_sold: item.is_sold,
  //     };

  //     if (code === "3") {
  //       desired = {
  //         tracks_stock: false,
  //         is_purchased: false,
  //         is_made_here: false,
  //         is_sold: true,
  //       };
  //     } else if (code === "1") {
  //       desired = { ...desired, is_sold: false, is_made_here: false };
  //     } else if (code === "2") {
  //       desired = {
  //         tracks_stock: true,
  //         is_purchased: true,
  //         is_sold: true,
  //         is_made_here: item.is_made_here,
  //       };
  //     }

  //     if (
  //       desired.tracks_stock !== item.tracks_stock ||
  //       desired.is_purchased !== item.is_purchased ||
  //       desired.is_made_here !== item.is_made_here ||
  //       desired.is_sold !== item.is_sold
  //     ) {
  //       setValue(`items.${index}.tracks_stock`, desired.tracks_stock, {
  //         shouldValidate: true,
  //       });
  //       setValue(`items.${index}.is_purchased`, desired.is_purchased, {
  //         shouldValidate: true,
  //       });
  //       setValue(`items.${index}.is_made_here`, desired.is_made_here, {
  //         shouldValidate: true,
  //       });
  //       setValue(`items.${index}.is_sold`, desired.is_sold, {
  //         shouldValidate: true,
  //       });
  //     }
  //   });
  // }, [items, setValue]);

  const onSubmit = () => {
    const data = getValues();

    // Filter out completely empty rows
    const filledItems = data.items.filter((item) => {
      return (
        item.item_name?.trim() || item.product_type_code || item.tax_type_code
      );
    });

    if (filledItems.length === 0) {
      toast.error("Please fill at least one item");
      return;
    }

    // Manual validation on filled rows only
    for (const item of filledItems) {
      if (
        !item.item_name?.trim() ||
        !item.product_type_code ||
        !item.tax_type_code
      ) {
        toast.error("Please complete all fields in the filled rows");
        return;
      }
    }

    const payload = filledItems.map((item) => ({
      brand_name: item.brand_name.trim(),
      item_name: item.item_name.trim(),
      product_type_code: item.product_type_code.value,
      tax_type_code: item.tax_type_code.value,
      is_purchased: item.is_purchased,
      is_sold: item.is_sold,
      is_made_here: item.is_made_here,
      tracks_stock: item.tracks_stock,
    }));

    bulkCreate.mutate(payload, {
      onSuccess: () => {
        toast.success(`${payload.length} items created successfully!`);
        reset();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to create items");
      },
    });
  };

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg">Loading options...</p>
      </div>
    );
  }

  // Table data now uses filtered items for display
  const tableData = filteredItems.map((_, index) => ({
    id: `row-${index}`,
    index,
  }));

  return (
    <div>
      <PageHeader
        title="Add Items"
        breadcrumb="Items"
        breadcrumbPath={routes.listItems}
        buttons={[
          {
            label: "Save Items",
            icon: Save,
            onClick: handleSubmit(onSubmit),
            variant: "primary",
          },
        ]}
      />

      <div className="mx-4">
        <div className="border-b border-neutral-200 dark:border-neutral-700 mt-10"></div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ReusableTable
            data={tableData}
            columns={COLUMNS}
            scopedColumns={{
              row_number: (item) => (
                <td className="text-center font-medium text-neutral-600">
                  {item.index + 1}
                </td>
              ),

              brand_name: (item) => (
                <td>
                  <Controller
                    control={control}
                    name={`items.${item.index}.brand_name`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  />
                </td>
              ),

              item_name: (item) => (
                <td>
                  <Controller
                    control={control}
                    name={`items.${item.index}.item_name`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  />
                </td>
              ),

              product_type: (item) => (
                <td>
                  <Controller
                    control={control}
                    name={`items.${item.index}.product_type_code`}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={options?.productTypes?.map((t: any) => ({
                          label: t.name,
                          value: t.code,
                        }))}
                        isSearchable={false}
                        menuPlacement="auto"
                        menuPortalTarget={document.body}
                        className="my-react-select-container text-sm"
                        classNamePrefix="my-react-select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minWidth: SELECT_MIN_WIDTH,
                          }),
                        }}
                        isClearable={false}
                      />
                    )}
                  />
                </td>
              ),

              tax_type: (item) => {
                return (
                  <td>
                    <div>
                      <Controller
                        control={control}
                        name={`items.${item.index}.tax_type_code`}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={options?.taxTypes?.map((t: any) => ({
                              label: t.name,
                              value: t.code,
                            }))}
                            isSearchable
                            menuPlacement="auto"
                            menuPortalTarget={document.body}
                            className="my-react-select-container text-sm"
                            classNamePrefix="my-react-select"
                            styles={{
                              control: (base) => ({
                                ...base,
                                minWidth: SELECT_MIN_WIDTH,
                              }),
                            }}
                            isClearable={false}
                          />
                        )}
                      />
                    </div>
                  </td>
                );
              },

              is_purchased: (item) => {
                return (
                  <td className="text-center">
                    <div>
                      <Controller
                        control={control}
                        name={`items.${item.index}.is_purchased`}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                          />
                        )}
                      />
                    </div>
                  </td>
                );
              },

              is_sold: (item) => {
                return (
                  <td className="text-center">
                    <div>
                      <Controller
                        control={control}
                        name={`items.${item.index}.is_sold`}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                          />
                        )}
                      />
                    </div>
                  </td>
                );
              },

              is_made_here: (item) => {
                return (
                  <td className="text-center">
                    <div>
                      <Controller
                        control={control}
                        name={`items.${item.index}.is_made_here`}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                          />
                        )}
                      />
                    </div>
                  </td>
                );
              },

              tracks_stock: (item) => {
                return (
                  <td className="text-center">
                    <div>
                      <Controller
                        control={control}
                        name={`items.${item.index}.tracks_stock`}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="
                w-4 h-4
                rounded
                text-[14px]
                border-neutral-300 dark:border-neutral-700
                bg-white dark:bg-neutral-800
                accent-primary dark:accent-primary/90
                focus:ring-primary focus:ring-offset-0
              "
                          />
                        )}
                      />
                    </div>
                  </td>
                );
              },
            }}
          />

          {errors.items && (
            <p className="text-center text-red-600 font-medium text-lg mt-8">
              {errors.items.message || "Please complete at least one item"}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddBulkItemsPage;
