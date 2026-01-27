'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { usePaymentMethods, useCustomers, useCreateSale } from '@/hooks/useSales';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type SaleItem = {
  item_uom_option_id: string;
  quantity: number;
  notes?: string;
};

type CustomerOption = {
  value: string;
  label: string;
  phone?: string;
  kra_pin?: string;
};

type CreateSaleFormProps = {
  onSubmit?: (data: any) => Promise<void>;
  initialDate?: string;
  className?: string;
};

const CreateSaleForm = ({ onSubmit, initialDate, className = '' }: CreateSaleFormProps) => {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(initialDate || today);

  // Customer search fields
  const [customerNameSearch, setCustomerNameSearch] = useState('');
  const [customerPhoneSearch, setCustomerPhoneSearch] = useState('');
  const [customerKraPinSearch, setCustomerKraPinSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);

  const { data: customers = [] } = useCustomers(
    customerNameSearch || customerPhoneSearch || customerKraPinSearch
  );

  // Item search (per row)
  const [itemSearches, setItemSearches] = useState<string[]>(['']);
  const [items, setItems] = useState<SaleItem[]>([{ item_uom_option_id: '', quantity: 0 }]);

  // Payment methods (your hardcoded list)
  const paymentMethods = [
    { code: "01", name: "Cash", description: "Cash payment" },
    { code: "04", name: "Mobile Money", description: "M-Pesa, Airtel Money, T-Kash" },
    { code: "10", name: "Complimentary", description: "Any other payment method" },
    { code: "10", name: "Credit", description: "Any other payment method" },
  ];
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('01');

  // Confirm dialog for cash
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tenderedAmount, setTenderedAmount] = useState<number | ''>('');
  const [changeAmount, setChangeAmount] = useState<number>(0);

  const createSaleMutation = useCreateSale();

  // Calculate change
  useEffect(() => {
    if (selectedPaymentMethod === '01' && typeof tenderedAmount === 'number') {
      const total = 0; // ← Replace with real total calculation
      setChangeAmount(tenderedAmount - total);
    }
  }, [tenderedAmount, selectedPaymentMethod]);

  const addItemRow = () => {
    setItems([...items, { item_uom_option_id: '', quantity: 0 }]);
    setItemSearches([...itemSearches, '']);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
    setItemSearches(itemSearches.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    setItems(items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const updateItemSearch = (index: number, value: string) => {
    setItemSearches(itemSearches.map((s, i) => i === index ? value : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.some(i => !i.item_uom_option_id || i.quantity <= 0)) {
      toast.error('All items must have a selection and quantity > 0');
      return;
    }

    // Show confirm dialog only for cash
    if (selectedPaymentMethod === '01') {
      setShowConfirmDialog(true);
      return;
    }

    saveSale();
  };

  const saveSale = () => {
    const payload = {
      outlet_id: "your-outlet-id",
      storage_area_id: "your-storage-id",
      customer_id: selectedCustomer?.value || null,
      is_complimentary: false,
      is_credit: false,
      payment_method_code: selectedPaymentMethod,
      reference_number: null,
      buyer_pin: null,
      device: null,
      notes: null,
      items: items.map(i => ({
        item_uom_option_id: i.item_uom_option_id,
        quantity: i.quantity,
        notes: i.notes,
      })),
    };

    if (onSubmit) {
      onSubmit(payload);
    } else {
      createSaleMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Sale created successfully!');
          router.back();
        },
      });
    }
  };

  return (
    <>
      <form 
        onSubmit={handleSubmit} 
        className={clsx(
          "h-full flex flex-col bg-white dark:bg-neutral-900 ",
          className
        )}
      >
        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 lg:divide-x lg:divide-neutral-200 dark:lg:divide-neutral-700">
            {/* Left Column: Date + Customer Details */}
            <div className="space-y-10 lg:pr-16">
              {/* Date */}
              <div>
                <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded  text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Customer Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white pb-4">Customer Details</h3>

                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">Customer</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerNameSearch}
                      onChange={(e) => setCustomerNameSearch(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded  text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    {/* Custom dropdown */}
                    {customerNameSearch && customers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-lg max-h-60 overflow-y-auto">
                        {customers.map((c: any) => (
                          <div
                            key={c.id}
                            className="px-4 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            onClick={() => {
                              setSelectedCustomer({ value: c.id, label: c.name, phone: c.phone, kra_pin: c.kra_pin });
                              setCustomerNameSearch(c.name);
                              setCustomerPhoneSearch(c.phone || '');
                              setCustomerKraPinSearch(c.kra_pin || '');
                            }}
                          >
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={customerPhoneSearch}
                      onChange={(e) => setCustomerPhoneSearch(e.target.value)}
                      placeholder="Enter or search phone..."
                      className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded  text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    {customerPhoneSearch && customers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-lg max-h-60 overflow-y-auto">
                        {customers.map((c: any) => (
                          <div
                            key={c.id}
                            className="px-4 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            onClick={() => {
                              setSelectedCustomer({ value: c.id, label: c.name, phone: c.phone, kra_pin: c.kra_pin });
                              setCustomerPhoneSearch(c.phone || '');
                              setCustomerNameSearch(c.name);
                              setCustomerKraPinSearch(c.kra_pin || '');
                            }}
                          >
                            {c.name} ({c.phone})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">KRA PIN</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerKraPinSearch}
                      onChange={(e) => setCustomerKraPinSearch(e.target.value)}
                      placeholder="Enter or search KRA PIN..."
                      className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded  text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    {customerKraPinSearch && customers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded shadow-lg max-h-60 overflow-y-auto">
                        {customers.map((c: any) => (
                          <div
                            key={c.id}
                            className="px-4 py-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            onClick={() => {
                              setSelectedCustomer({ value: c.id, label: c.name, phone: c.phone, kra_pin: c.kra_pin });
                              setCustomerKraPinSearch(c.kra_pin || '');
                              setCustomerNameSearch(c.name);
                              setCustomerPhoneSearch(c.phone || '');
                            }}
                          >
                            {c.kra_pin} ({c.name})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
       

          {/* Right Column: Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-neutral-900 dark:text-white">Order Details</h3>

            {/* Scrollable item rows */}
            <div className="max-h-[50vh] overflow-y-auto ">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 pb-2 last:pb-0 border-neutral-200 dark:border-neutral-700 group"
                >
                  {/* Item search */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Item"
                      className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded  text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {/* Price */}
                  <div className="w-32">
                    <input
                      type="text"
                      placeholder="Price"
                      readOnly
                      className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded  text-neutral-900 dark:text-neutral-100 cursor-not-allowed"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded  text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-opacity"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
            >
              <Plus size={16} />
              Add Item
            </button>

            {/* Summary Section */}
            <div className="space-y-2 pt-8 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                <span className="text-[13px] font-medium">Subtotal:</span>
                <span className="text-[13px] font-bold text-neutral-900 dark:text-white">KES 0.00</span>
              </div>

              <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                <span className="text-[13px] font-medium">Tax:</span>
                <span className="text-[13px] font-bold text-neutral-900 dark:text-white">KES 0.00</span>
              </div>

              <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                <span className="text-[13px] font-medium">Discount:</span>
                <span className="text-[13px] font-bold text-neutral-900 dark:text-white">KES 0.00</span>
              </div>

              <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
                <span>Total</span>
                <span>KES 0.00</span>
              </div>

              {/* Payment Method Chips */}
              <div className="pt-6">
                <label className="block text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Payment Method
                </label>
                <div className="flex flex-wrap gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.code}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.code)}
                      className={clsx(
                        'px-6 py-2 rounded text-[13px] font-medium transition-all',
                        selectedPaymentMethod === method.code
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      )}
                    >
                      {method.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </form>

      {/* Footer */}
      <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-700 mt-8 px-6 pb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={createSaleMutation.isPending}
          className="px-8 py-3 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {createSaleMutation.isPending ? 'Saving...' : 'Save Sale'}
        </button>
      </div>

      {/* Cash Tendered Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">Confirm Cash Payment</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Total Amount
                </label>
                <input
                  type="text"
                  readOnly
                  value="KES 0.00" // ← Replace with real total
                  className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Amount Tendered
                </label>
                <input
                  type="number"
                  min="0"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(Number(e.target.value) || '')}
                  className="w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Enter amount paid"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Change
                </label>
                <input
                  type="text"
                  readOnly
                  value={changeAmount >= 0 ? `KES ${changeAmount.toLocaleString()}` : 'Insufficient'}
                  className={clsx(
                    "w-full px-4 py-2 text-[13px] border border-neutral-300 dark:border-neutral-700 rounded bg-neutral-50 dark:bg-neutral-800",
                    changeAmount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={tenderedAmount < 0}
                onClick={() => {
                  setShowConfirmDialog(false);
                  saveSale();
                }}
                className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateSaleForm;