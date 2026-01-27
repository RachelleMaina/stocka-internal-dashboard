import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Item, ItemOption, ItemVariant } from "../../types/item";
import { Category } from "../../types/category";
import FloatingInput from "../common/FloatingInput";


interface ProductFormProps {
  item: Item;
  categories: Category[];
  onSave: (item: Item) => void;
  onClose: () => void;
}

const schema = Joi.object({
  name: Joi.string().required(),
  categoryId: Joi.number().greater(0).required(),
  buyingPrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  barcode: Joi.string().allow(""),
  sku: Joi.string().allow(""),
  trackStock: Joi.boolean(),
  stock: Joi.when("trackStock", {
    is: true,
    then: Joi.number().min(0).required(),
    otherwise: Joi.forbidden(),
  }),
});

const ProductForm: React.FC<ProductFormProps> = ({ item, categories, onSave, onClose }) => {
  const methods = useForm({
    resolver: joiResolver(schema),
    defaultValues: {
      name: item.name,
      categoryId: item.categoryId,
      buyingPrice: item.buyingPrice,
      sellingPrice: item.sellingPrice,
      barcode: item.barcode,
      sku: item.sku,
      trackStock: item.trackStock,
      stock: item.stock,
    },
  });


  const {     register,handleSubmit, setValue, watch, formState } = methods;

  const watchTrackStock = watch("trackStock");

  const [options, setOptions] = useState<ItemOption[]>([]);
  const [variants, setVariants] = useState<ItemVariant[]>(item.variants);

  useEffect(() => {
    if (item.variants.length > 0) {
      setOptions([
        { name: "Size", values: ["S", "L"] },
        { name: "Color", values: ["Red", "Green"] },
      ]);
    }
  }, [item.variants]);

  useEffect(() => {
    setVariants(generateVariants(options));
  }, [options]);

  const generateVariants = (opts: ItemOption[]): ItemVariant[] => {
    const combinations: string[][] = [];

    const combine = (index: number, current: string[]) => {
      if (index === opts.length) {
        combinations.push([...current]);
        return;
      }
      for (const value of opts[index].values) {
        combine(index + 1, [...current, value]);
      }
    };

    combine(0, []);

    const baseSku = watch("sku");
    const baseBarcode = watch("barcode");
    const baseBuying = watch("buyingPrice");
    const baseSelling = watch("sellingPrice");

    return combinations.map((combo, index) => ({
      id: variants[index]?.id || index + 1,
      optionValues: combo,
      sku: variants[index]?.sku || `${baseSku}-${combo.join("-")}`,
      barcode: variants[index]?.barcode || `${baseBarcode}-${index + 1}`,
      buyingPrice: variants[index]?.buyingPrice || baseBuying,
      sellingPrice: variants[index]?.sellingPrice || baseSelling,
    }));
  };

  const handleOptionChange = (index: number, field: "name" | "values", value: string | string[]) => {
    const newOptions = [...options];
    if (field === "name") {
      newOptions[index].name = value as string;
    } else {
      newOptions[index].values = value as string[];
    }
    setOptions(newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleVariantChange = (
    index: number,
    field: keyof ItemVariant,
    value: string | number
  ) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const onSubmit = (data: any) => {
    onSave({
      ...item,
      ...data,
      stock: data.trackStock ? data.stock : 0,
      variants,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">{item.id ? "Edit Item" : "Add Item"}</h2>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput
                label="Item Name"
                id="name"
                required
                register={methods.register("name")}
                error={formState.errors.name?.message}
              />
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  {...register("categoryId")}
                  className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800"
                >
                  <option value={0}>Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formState.errors.name?.message && (
                  <p className="text-sm text-red-500 mt-1">{formState.errors.name?.message}</p>
                )}
              </div>
              <FloatingInput
                label="Buying Price"
                type="number"
                id="buyingPrice"
                required
                register={methods.register("name")}
                error={formState.errors.name?.message}
              />
              <FloatingInput
                label="Selling Price"
                type="number"
                id="sellingPrice"
                required
                register={methods.register("name")}
                error={formState.errors.name?.message}
              />
              <FloatingInput
                label="Barcode"
                id="barcode"
                register={methods.register("name")}
                error={formState.errors.name?.message}
              />
              <FloatingInput
                label="SKU"
                id="sku"
                register={methods.register("name")}
                error={formState.errors.name?.message}
              />
            </div>

            <div className="mt-6">
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" {...register("trackStock")} />
                <span>Track Stock</span>
              </label>

              {watchTrackStock && (
                <div className="mt-4">
                  <FloatingInput
                    label="In Stock"
                    type="number"
                    id="stock"
                    required
                    register={methods.register("name")}
                    error={formState.errors.name?.message}
                  />
                </div>
              )}
            </div>

            {/* Variants */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Variants</h3>
                <button
                  type="button"
                  onClick={() => setOptions([...options, { name: "", values: [] }])}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                >
                  + Add Option
                </button>
              </div>

              {options.map((option, index) => (
                <div key={index} className="mb-4 border p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <strong>Option {index + 1}</strong>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <FloatingInput
                    label="Option Name"
                    id={`option-name-${index}`}
                    error=""
                    value={option.name}
                    onChange={(e) => handleOptionChange(index, "name", e.target.value)}
                    register={methods.register("name")}
                    error={formState.errors.name?.message}
                  />
                  <FloatingInput
                    label="Option Values (comma separated)"
                    id={`option-values-${index}`}
                    error=""
                    value={option.values.join(", ")}
                    onChange={(e) =>
                      handleOptionChange(index, "values", e.target.value.split(",").map((v) => v.trim()))
                    }
                    register={methods.register("name")}
                    error={formState.errors.name?.message}
                  />
                </div>
              ))}

              {variants.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Generated Variants</h4>
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={index} className="border p-4 rounded">
                        <h5 className="font-semibold mb-2">{variant.optionValues.join(" / ")}</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FloatingInput
                            label="Variant SKU"
                            id={`variant-sku-${index}`}
                            value={variant.sku}
                            onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                          />
                          <FloatingInput
                            label="Variant Barcode"
                            id={`variant-barcode-${index}`}
                            value={variant.barcode}
                            onChange={(e) => handleVariantChange(index, "barcode", e.target.value)}
                          />
                          <FloatingInput
                            label="Buying Price"
                            type="number"
                            id={`variant-buying-${index}`}
                            value={variant.buyingPrice}
                            onChange={(e) =>
                              handleVariantChange(index, "buyingPrice", parseFloat(e.target.value))
                            }
                          />
                          <FloatingInput
                            label="Selling Price"
                            type="number"
                            id={`variant-selling-${index}`}
                            value={variant.sellingPrice}
                            onChange={(e) =>
                              handleVariantChange(index, "sellingPrice", parseFloat(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-primary"
              >
                Save
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ProductForm;
