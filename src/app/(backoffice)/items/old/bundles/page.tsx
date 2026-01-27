"use client"
import { useState } from "react";
import toast from "react-hot-toast";
import { Bundle } from "../../../../../types/bundle";
import { Item } from "../../../../../types/item";
import { Category } from "../../../../../types/category";
import ReusableTable from "@/components/common/ReusableTable";
import BundleForm from "@/components/backoffice/BundleForm";
import ConfirmDialog from "@/components/common/ConfirmDialog";


const Bundles: React.FC = () => {
  const [categories] = useState<Category[]>([
    { id: 1, name: "Electronics" },
    { id: 2, name: "Clothing" },
    { id: 3, name: "Groceries" },
  ]);

  const [items] = useState<Item[]>([
    {
      id: 1,
      name: "Smartphone",
      categoryId: 1,
      buyingPrice: 500,
      sellingPrice: 599.99,
      barcode: "123456789012",
      sku: "SMRT123",
      trackStock: true,
      stock: 50,
      variants: [],
    },
    {
      id: 2,
      name: "T-Shirt",
      categoryId: 2,
      buyingPrice: 15,
      sellingPrice: 19.99,
      barcode: "987654321098",
      sku: "TSH456",
      trackStock: true,
      stock: 100,
      variants: [],
    },
    {
      id: 3,
      name: "Tie",
      categoryId: 2,
      buyingPrice: 10,
      sellingPrice: 14.99,
      barcode: "456789123456",
      sku: "TIE789",
      trackStock: true,
      stock: 80,
      variants: [],
    },
  ]);

  const [bundles, setBundles] = useState<Bundle[]>([
    {
      id: 1,
      name: "Shirt + Tie Bundle",
      categoryId: 2,
      buyingPrice: 25,
      sellingPrice: 34.98,
      barcode: "111222333444",
      sku: "BDL123",
      stock: 50,
      components: [
        { itemId: 2, quantity: 1 }, // T-Shirt
        { itemId: 3, quantity: 1 }, // Tie
      ],
    },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentBundle, setCurrentBundle] = useState<Bundle | null>(null);
  const [bundleToDelete, setBundleToDelete] = useState<Bundle | null>(null);

  const validateBundleStock = (bundle: Bundle): boolean => {
    for (const comp of bundle.components) {
      const item = items.find((it) => it.id === comp.itemId);
      if (!item || !item.trackStock) continue;
      const maxBundles = Math.floor(item.stock / comp.quantity);
      if (bundle.stock > maxBundles) {
        toast.error(
          `Stock for ${item.name} allows only ${maxBundles} bundles (needs ${comp.quantity} per bundle)`
        );
        return false;
      }
    }
    return true;
  };

  const handleSaveBundle = (bundle: Bundle) => {
    if (!bundle.name.trim()) {
      toast.error("Bundle name is required");
      return;
    }
    if (bundle.buyingPrice < 0) {
      toast.error("Buying price cannot be negative");
      return;
    }
    if (bundle.sellingPrice <= 0) {
      toast.error("Selling price must be greater than 0");
      return;
    }
    if (!bundle.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (!bundle.sku.trim()) {
      toast.error("SKU is required");
      return;
    }
    if (!bundle.barcode.trim()) {
      toast.error("Barcode is required");
      return;
    }
    if (bundle.stock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }
    if (bundle.components.length === 0) {
      toast.error("At least one component item is required");
      return;
    }
    if (!validateBundleStock(bundle)) {
      return;
    }

    if (bundle.id) {
      setBundles(bundles.map((b) => (b.id === bundle.id ? bundle : b)));
      toast.success("Bundle updated successfully");
    } else {
      const newBundle: Bundle = { ...bundle, id: bundles.length + 1 };
      setBundles([...bundles, newBundle]);
      toast.success("Bundle added successfully");
    }
    setIsFormOpen(false);
    setCurrentBundle(null);
  };

  const handleDeleteBundle = (id: number) => {
    setBundles(bundles.filter((b) => b.id !== id));
    toast.success("Bundle deleted successfully");
    setIsDeleteOpen(false);
    setBundleToDelete(null);
  };

  const openAddForm = () => {
    setCurrentBundle({
      id: 0,
      name: "",
      categoryId: 0,
      buyingPrice: 0,
      sellingPrice: 0,
      barcode: "",
      sku: "",
      stock: 0,
      components: [],
    });
    setIsFormOpen(true);
  };

  const openEditForm = (bundle: Bundle) => {
    setCurrentBundle(bundle);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (bundle: Bundle) => {
    setBundleToDelete(bundle);
    setIsDeleteOpen(true);
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "categoryId",
      label: "Category",
      render: (bundle: Bundle) =>
        categories.find((cat) => cat.id === bundle.categoryId)?.name || "Unknown",
    },
    {
      key: "sellingPrice",
      label: "Price",
      render: (bundle: Bundle) => `$${bundle.sellingPrice.toFixed(2)}`,
    },
    { key: "stock", label: "Stock" },
    {
      key: "components",
      label: "Components",
      render: (bundle: Bundle) =>
        bundle.components
          .map((comp) => {
            const item = items.find((it) => it.id === comp.itemId);
            return item ? `${item.name} (x${comp.quantity})` : "Unknown";
          })
          .join(", "),
    },
    {
      key: "actions",
      label: "Actions",
      render: (bundle: Bundle) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditForm(bundle)}
            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteConfirmation(bundle)}
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bundles</h1>

      <button
        onClick={openAddForm}
        className="mb-4 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-primary"
      >
        Add Bundle
      </button>

      <ReusableTable data={bundles} columns={columns} searchKey="name" pageSize={5} />

      {isFormOpen && currentBundle && (
        <BundleForm
          bundle={currentBundle}
          categories={categories}
          items={items}
          onSave={handleSaveBundle}
          onClose={() => {
            setIsFormOpen(false);
            setCurrentBundle(null);
          }}
        />
      )}

      {isDeleteOpen && bundleToDelete && (
        <ConfirmDialog
          bundle={bundleToDelete}
          onConfirm={() => handleDeleteBundle(bundleToDelete.id)}
          onCancel={() => {
            setIsDeleteOpen(false);
            setBundleToDelete(null);
          }}
        />
      )}

    
    </div>
  );
};

export default Bundles;