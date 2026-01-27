"use client"
import { useState, useEffect } from "react";
import { Discount } from "../../types/discount";
import { Category } from "../../types/category";
import { Item } from "../../types/item";
import { Bundle } from "../../types/bundle";

interface DiscountFormProps {
  discount: Discount;
  categories: Category[];
  items: Item[];
  bundles: Bundle[];
  onSave: (discount: Discount) => void;
  onClose: () => void;
}

const DiscountForm: React.FC<DiscountFormProps> = ({
  discount,
  categories,
  items,
  bundles,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(discount.name);
  const [type, setType] = useState(discount.type);
  const [amount, setAmount] = useState(discount.amount);
  const [bogoTriggerItemId, setBogoTriggerItemId] = useState(discount.bogoTriggerItemId || 0);
  const [bogoRewardItemId, setBogoRewardItemId] = useState(discount.bogoRewardItemId || 0);
  const [bogoTriggerQuantity, setBogoTriggerQuantity] = useState(
    discount.bogoTriggerQuantity || 1
  );
  const [bogoRewardQuantity, setBogoRewardQuantity] = useState(
    discount.bogoRewardQuantity || 1
  );
  const [startDate, setStartDate] = useState(
    discount.startDate ? discount.startDate.split("T")[0] : ""
  );
  const [startTime, setStartTime] = useState(
    discount.startDate ? discount.startDate.split("T")[1].slice(0, 5) : ""
  );
  const [endDate, setEndDate] = useState(
    discount.endDate ? discount.endDate.split("T")[0] : ""
  );
  const [endTime, setEndTime] = useState(
    discount.endDate ? discount.endDate.split("T")[1].slice(0, 5) : ""
  );
  const [happyHourDays, setHappyHourDays] = useState<number[]>(discount.happyHourDays || []);
  const [happyHourStartTime, setHappyHourStartTime] = useState(
    discount.happyHourStartTime || ""
  );
  const [happyHourEndTime, setHappyHourEndTime] = useState(discount.happyHourEndTime || "");
  const [applicableItemIds, setApplicableItemIds] = useState(discount.applicableItemIds);
  const [applicableCategoryIds, setApplicableCategoryIds] = useState(
    discount.applicableCategoryIds
  );
  const [applicableBundleIds, setApplicableBundleIds] = useState(discount.applicableBundleIds);

  useEffect(() => {
    setName(discount.name);
    setType(discount.type);
    setAmount(discount.amount);
    setBogoTriggerItemId(discount.bogoTriggerItemId || 0);
    setBogoRewardItemId(discount.bogoRewardItemId || 0);
    setBogoTriggerQuantity(discount.bogoTriggerQuantity || 1);
    setBogoRewardQuantity(discount.bogoRewardQuantity || 1);
    setStartDate(discount.startDate ? discount.startDate.split("T")[0] : "");
    setStartTime(discount.startDate ? discount.startDate.split("T")[1].slice(0, 5) : "");
    setEndDate(discount.endDate ? discount.endDate.split("T")[0] : "");
    setEndTime(discount.endDate ? discount.endDate.split("T")[1].slice(0, 5) : "");
    setHappyHourDays(discount.happyHourDays || []);
    setHappyHourStartTime(discount.happyHourStartTime || "");
    setHappyHourEndTime(discount.happyHourEndTime || "");
    setApplicableItemIds(discount.applicableItemIds);
    setApplicableCategoryIds(discount.applicableCategoryIds);
    setApplicableBundleIds(discount.applicableBundleIds);
  }, [discount]);

  const handleToggleItem = (itemId: number) => {
    setApplicableItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleToggleCategory = (categoryId: number) => {
    setApplicableCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleToggleBundle = (bundleId: number) => {
    setApplicableBundleIds((prev) =>
      prev.includes(bundleId) ? prev.filter((id) => id !== bundleId) : [...prev, bundleId]
    );
  };

  const handleToggleDay = (day: number) => {
    setHappyHourDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const discountData: Discount = {
      id: discount.id,
      name,
      type,
      amount,
      bogoTriggerItemId: type === "BOGO" ? bogoTriggerItemId : undefined,
      bogoRewardItemId: type === "BOGO" ? bogoRewardItemId : undefined,
      bogoTriggerQuantity: type === "BOGO" ? bogoTriggerQuantity : undefined,
      bogoRewardQuantity: type === "BOGO" ? bogoRewardQuantity : undefined,
      startDate: startDate && startTime ? `${startDate}T${startTime}:00Z` : undefined,
      endDate: endDate && endTime ? `${endDate}T${endTime}:00Z` : undefined,
      happyHourDays: type === "HAPPY_HOUR" ? happyHourDays : undefined,
      happyHourStartTime: type === "HAPPY_HOUR" ? happyHourStartTime : undefined,
      happyHourEndTime: type === "HAPPY_HOUR" ? happyHourEndTime : undefined,
      applicableItemIds,
      applicableCategoryIds,
      applicableBundleIds,
    };
    onSave(discountData);
  };

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">
          {discount.id ? "Edit Discount" : "Add Discount"}
        </h2>
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
                  placeholder="Enter discount name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as Discount["type"])
                  }
                  className="w-full border px-3 py-2 rounded"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="PRICE">Price</option>
                  <option value="BOGO">BOGO</option>
                  <option value="HAPPY_HOUR">Happy Hour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount {type === "PRICE" ? "($)" : "(%)"}
                </label>
                <input
                  type="number"
                  step={type === "PRICE" ? "0.01" : "1"}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full border px-3 py-2 rounded"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            {type === "BOGO" && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Trigger Item</label>
                  <select
                    value={bogoTriggerItemId}
                    onChange={(e) => setBogoTriggerItemId(Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value={0}>Select item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Trigger Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={bogoTriggerQuantity}
                    onChange={(e) => setBogoTriggerQuantity(Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Buy X"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Item</label>
                  <select
                    value={bogoRewardItemId}
                    onChange={(e) => setBogoRewardItemId(Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value={0}>Select item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reward Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={bogoRewardQuantity}
                    onChange={(e) => setBogoRewardQuantity(Number(e.target.value))}
                    className="w-full border px-3 py-2 rounded"
                    placeholder="Get Y"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Applicability Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Applicability</h3>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Items</h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <label key={item.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={applicableItemIds.includes(item.id)}
                      onChange={() => handleToggleItem(item.id)}
                      className="mr-2"
                    />
                    {item.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-medium mb-2">Categories</h4>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={applicableCategoryIds.includes(cat.id)}
                      onChange={() => handleToggleCategory(cat.id)}
                      className="mr-2"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Bundles</h4>
              <div className="space-y-2">
                {bundles.map((bundle) => (
                  <label key={bundle.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={applicableBundleIds.includes(bundle.id)}
                      onChange={() => handleToggleBundle(bundle.id)}
                      className="mr-2"
                    />
                    {bundle.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Schedule</h3>
            {type !== "HAPPY_HOUR" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
            )}
            {type === "HAPPY_HOUR" && (
              <div>
                <h4 className="font-medium mb-2">Days</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {days.map((day, index) => (
                    <label key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={happyHourDays.includes(index)}
                        onChange={() => handleToggleDay(index)}
                        className="mr-2"
                      />
                      {day}
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={happyHourStartTime}
                      onChange={(e) => setHappyHourStartTime(e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={happyHourEndTime}
                      onChange={(e) => setHappyHourEndTime(e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                    />
                  </div>
                </div>
              </div>
            )}
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

export default DiscountForm;