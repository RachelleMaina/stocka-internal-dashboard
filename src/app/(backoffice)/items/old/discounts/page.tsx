"use client"
import { useState } from "react";
import toast from "react-hot-toast";
import { Discount } from "../../../../../types/discount";
import { Item } from "../../../../../types/item";
import { Category } from "../../../../../types/category";
import { Bundle } from "../../../../../types/bundle";

import DiscountForm from "@/components/common/DiscountForm";
import ReusableTable from "@/components/common/ReusableTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";


const Discounts: React.FC = () => {
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
  ]);

  const [bundles] = useState<Bundle[]>([
    {
      id: 1,
      name: "Shirt + Tie Bundle",
      categoryId: 2,
      buyingPrice: 25,
      sellingPrice: 34.98,
      barcode: "111222333444",
      sku: "BDL123",
      stock: 50,
      components: [{ itemId: 2, quantity: 1 }],
    },
  ]);

  const [discounts, setDiscounts] = useState<Discount[]>([
    {
      id: 1,
      name: "BOGO T-Shirt",
      type: "BOGO",
      amount: 100, // 100% off reward item
      bogoTriggerItemId: 2, // T-Shirt
      bogoRewardItemId: 2, // T-Shirt
      bogoTriggerQuantity: 1,
      bogoRewardQuantity: 1,
      applicableItemIds: [2],
      applicableCategoryIds: [],
      applicableBundleIds: [],
    },
    {
      id: 2,
      name: "10% Off Electronics",
      type: "PERCENTAGE",
      amount: 10,
      startDate: "2025-04-15T00:00:00Z",
      endDate: "2025-04-30T23:59:59Z",
      applicableItemIds: [],
      applicableCategoryIds: [1],
      applicableBundleIds: [],
    },
    {
      id: 3,
      name: "Happy Hour Groceries",
      type: "HAPPY_HOUR",
      amount: 15,
      happyHourDays: [1], // Monday
      happyHourStartTime: "15:00",
      happyHourEndTime: "17:00",
      applicableItemIds: [],
      applicableCategoryIds: [3],
      applicableBundleIds: [],
    },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState<Discount | null>(null);
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null);

  const validateDiscount = (discount: Discount): boolean => {
    if (discount.type === "BOGO") {
      if (!discount.bogoTriggerItemId || !discount.bogoRewardItemId) {
        toast.error("BOGO requires trigger and reward items");
        return false;
      }
      if (!discount.bogoTriggerQuantity || !discount.bogoRewardQuantity) {
        toast.error("BOGO requires trigger and reward quantities");
        return false;
      }
    }
    if (discount.type === "HAPPY_HOUR") {
      if (!discount.happyHourDays?.length) {
        toast.error("Happy hour requires at least one day");
        return false;
      }
      if (!discount.happyHourStartTime || !discount.happyHourEndTime) {
        toast.error("Happy hour requires start and end times");
        return false;
      }
      if (discount.happyHourStartTime >= discount.happyHourEndTime) {
        toast.error("Happy hour end time must be after start time");
        return false;
      }
    }
    if (discount.startDate && discount.endDate && discount.startDate > discount.endDate) {
      toast.error("End date must be after start date");
      return false;
    }
    if (
      discount.applicableItemIds.length === 0 &&
      discount.applicableCategoryIds.length === 0 &&
      discount.applicableBundleIds.length === 0
    ) {
      toast.error("Discount must apply to at least one item, category, or bundle");
      return false;
    }
    return true;
  };

  const handleSaveDiscount = (discount: Discount) => {
    if (!discount.name.trim()) {
      toast.error("Discount name is required");
      return;
    }
    if (discount.amount < 0) {
      toast.error("Discount amount cannot be negative");
      return;
    }
    if (!validateDiscount(discount)) {
      return;
    }

    if (discount.id) {
      setDiscounts(discounts.map((d) => (d.id === discount.id ? discount : d)));
      toast.success("Discount updated successfully");
    } else {
      const newDiscount: Discount = { ...discount, id: discounts.length + 1 };
      setDiscounts([...discounts, newDiscount]);
      toast.success("Discount added successfully");
    }
    setIsFormOpen(false);
    setCurrentDiscount(null);
  };

  const handleDeleteDiscount = (id: number) => {
    setDiscounts(discounts.filter((d) => d.id !== id));
    toast.success("Discount deleted successfully");
    setIsDeleteOpen(false);
    setDiscountToDelete(null);
  };

  const openAddForm = () => {
    setCurrentDiscount({
      id: 0,
      name: "",
      type: "PERCENTAGE",
      amount: 0,
      applicableItemIds: [],
      applicableCategoryIds: [],
      applicableBundleIds: [],
    });
    setIsFormOpen(true);
  };

  const openEditForm = (discount: Discount) => {
    setCurrentDiscount(discount);
    setIsFormOpen(true);
  };

  const openDeleteConfirmation = (discount: Discount) => {
    setDiscountToDelete(discount);
    setIsDeleteOpen(true);
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    {
      key: "amount",
      label: "Amount",
      render: (discount: Discount) =>
        discount.type === "PRICE"
          ? `$${discount.amount.toFixed(2)}`
          : `${discount.amount}%`,
    },
    {
      key: "applicability",
      label: "Applies To",
      render: (discount: Discount) => {
        const itemNames = discount.applicableItemIds
          .map((id) => items.find((it) => it.id === id)?.name)
          .filter(Boolean);
        const categoryNames = discount.applicableCategoryIds
          .map((id) => categories.find((cat) => cat.id === id)?.name)
          .filter(Boolean);
        const bundleNames = discount.applicableBundleIds
          .map((id) => bundles.find((b) => b.id === id)?.name)
          .filter(Boolean);
        return [...itemNames, ...categoryNames, ...bundleNames].join(", ") || "None";
      },
    },
    {
      key: "schedule",
      label: "Schedule",
      render: (discount: Discount) => {
        if (discount.type === "HAPPY_HOUR") {
          const days = discount.happyHourDays
            ?.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d])
            .join(", ");
          return `${days} ${discount.happyHourStartTime}-${discount.happyHourEndTime}`;
        }
        if (discount.startDate && discount.endDate) {
          return `${new Date(discount.startDate).toLocaleDateString()} to ${new Date(
            discount.endDate
          ).toLocaleDateString()}`;
        }
        return "Always";
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (discount: Discount) => (
        <div className="flex space-x-2">
          <button
            onClick={() => openEditForm(discount)}
            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteConfirmation(discount)}
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
      <h1 className="text-2xl font-bold mb-4">Discounts</h1>

      <button
        onClick={openAddForm}
        className="mb-4 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-primary"
      >
        Add Discount
      </button>

      <ReusableTable data={discounts} columns={columns} searchKey="name" pageSize={5} />

      {isFormOpen && currentDiscount && (
        <DiscountForm
          discount={currentDiscount}
          categories={categories}
          items={items}
          bundles={bundles}
          onSave={handleSaveDiscount}
          onClose={() => {
            setIsFormOpen(false);
            setCurrentDiscount(null);
          }}
        />
      )}

      {isDeleteOpen && discountToDelete && (
        <ConfirmDialog
          discount={discountToDelete}
          onConfirm={() => handleDeleteDiscount(discountToDelete.id)}
          onCancel={() => {
            setIsDeleteOpen(false);
            setDiscountToDelete(null);
          }}
        />
      )}


    </div>
  );
};

export default Discounts;