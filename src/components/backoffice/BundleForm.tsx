"use client"
import { useState, useEffect } from "react";
import { Bundle, BundleComponent } from "../../types/bundle";
import { Category } from "../../types/category";
import { Item } from "../../types/item";

interface BundleFormProps {
  bundle: Bundle;
  categories: Category[];
  items: Item[];
  onSave: (bundle: Bundle) => void;
  onClose: () => void;
}

const BundleForm: React.FC<BundleFormProps> = ({ bundle, categories, items, onSave, onClose }) => {
  const [name, setName] = useState(bundle.name);
  const [categoryId, setCategoryId] = useState(bundle.categoryId);
  const [buyingPrice, setBuyingPrice] = useState(bundle.buyingPrice);
  const [sellingPrice, setSellingPrice] = useState(bundle.sellingPrice);
  const [barcode, setBarcode] = useState(bundle.barcode);
  const [sku, setSku] = useState(bundle.sku);
  const [stock, setStock] = useState(bundle.stock);
  const [components, setComponents] = useState<BundleComponent[]>(bundle.components);

  useEffect(() => {
    setName(bundle.name);
    setCategoryId(bundle.categoryId);
    setBuyingPrice(bundle.buyingPrice);
    setSellingPrice(bundle.sellingPrice);
    setBarcode(bundle.barcode);
    setSku(bundle.sku);
    setStock(bundle.stock);
    setComponents(bundle.components);
  }, [bundle]);

  const handleAddComponent = () => {
    setComponents([...components, { itemId: 0, quantity: 1 }]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: keyof BundleComponent, value: number) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setComponents(newComponents);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: bundle.id,
      name,
      categoryId,
      buyingPrice,
      sellingPrice,
      barcode,
      sku,
      stock,
      components,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">{bundle.id ? "Edit Bundle" : "Add Bundle"}</h2>
        <form onSubmit={handleSubmit}>
          {/* General Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">General</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter bundle name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value={0}>Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Buying Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter buying price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Selling Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter selling price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Barcode</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter barcode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter SKU"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter stock quantity"
                />
              </div>
            </div>
          </div>

          {/* Components Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Components</h3>
            <button
              type="button"
              onClick={handleAddComponent}
              className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Add Component
            </button>
            {components.map((comp, index) => (
              <div key={index} className="mb-4 p-4 border rounded flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Item</label>
                  <select
                    value={comp.itemId}
                    onChange={(e) => handleComponentChange(index, "itemId", Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value={0}>Select an item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={comp.quantity}
                    onChange={(e) => handleComponentChange(index, "quantity", Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Qty"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveComponent(index)}
                  className="text-red-500 hover:text-red-700 mt-6"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
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
      </div>
    </div>
  );
};

export default BundleForm;