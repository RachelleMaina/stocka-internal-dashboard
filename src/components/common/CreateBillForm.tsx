'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, X, User, PersonStanding } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Select, { SingleValue } from 'react-select';
import { useSaleItems } from '@/hooks/useSaleItems';

// ── Types ────────────────────────────────────────────────
type SaleItem = {
  itemSearch: string;
  item_uom_option_id: string;
  quantity: number;
  selectedItem?: any;
};

type ItemOption = {
  value: string;
  label: string;
  item: any;
};

type WaiterOption = {
  value: string;
  label: string;
  isWalkIn?: boolean;
};

type CreateBillFormProps = {
  onSubmit: (payload: any) => Promise<void>;
  waiters: WaiterOption[];
  initialWaiter?: WaiterOption | null;
  initialDate?: string;
  initialData?: any;
  channelId: string;      // used as outlet_sales_channel_id
  channelName: string;
  outletId: string;       // ← NEW: required by schema
};

const paymentMethods = [
  { code: '01', name: 'Cash' },
  { code: '04', name: 'Mpesa' },
  { code: '10', name: 'Complimentary' },
  { code: '10', name: 'Credit' },
];

const CreateBillForm: React.FC<CreateBillFormProps> = ({
  onSubmit,
  waiters,
  initialWaiter,
  initialDate,
  channelId,
  channelName,
  outletId, // ← passed from parent
}) => {
  const [step, setStep] = useState<1 | 2>(initialWaiter ? 2 : 1);
  const [selectedWaiter, setSelectedWaiter] = useState<WaiterOption | null>(initialWaiter || null);

  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [items, setItems] = useState<SaleItem[]>([
    { itemSearch: '', item_uom_option_id: '', quantity: 1 },
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // New: checkboxes & reference
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [isCredit, setIsCredit] = useState(true);
  const [referenceNumber, setReferenceNumber] = useState('');

  const [searchTerms, setSearchTerms] = useState<string[]>(['']);

  const shouldFetch = searchTerms.some((term) => term.trim().length >= 2);
  const lastSearch = searchTerms[searchTerms.length - 1]?.trim() || '';

  const { data: saleItemsResponse, isLoading } = useSaleItems(
    {
      channelId,
      params: {
        search: lastSearch,
        limit: 15,
      },
    },
    { enabled: shouldFetch } 
  );

  const itemOptions: ItemOption[] = useMemo(() => {
    return (saleItemsResponse?.items || []).map((item: any) => ({
      value: item.item_uom_option_id,
      label: (() => {
        const name = `${item.brand_name || ''} ${item.item_name || ''}`.trim();
        const price = item?.price?.selling_price || 0;
        return name ? `${name} • KES ${price.toLocaleString()}` : 'Unnamed Item';
      })(),
      item,
    }));
  }, [saleItemsResponse]);

  // ── Totals ────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.selectedItem?.price?.selling_price || 0;
      return sum + item.quantity * price;
    }, 0);
  }, [items]);

  // ── Helpers ───────────────────────────────────────────────

  const isRowEmpty = (item: SaleItem) =>
    !item.item_uom_option_id && item.quantity === 1 && !item.itemSearch?.trim();

  const cleanTrailingEmptyRows = () => {
    setItems((prev) => {
      let newItems = [...prev];
      while (newItems.length > 1 && isRowEmpty(newItems[newItems.length - 1])) {
        newItems.pop();
      }
      return newItems;
    });
    setSearchTerms((prev) => prev.slice(0, items.length));
  };

  // ── Handlers ──────────────────────────────────────────

  const handleSelectWaiter = (waiter: WaiterOption) => {
    setSelectedWaiter(waiter);
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const addEmptyRow = () => {
    setItems((prev) => [...prev, { itemSearch: '', item_uom_option_id: '', quantity: 1 }]);
    setSearchTerms((prev) => [...prev, '']);
  };

  const handleItemChange = (index: number, option: SingleValue<ItemOption> | null) => {
    setItems((prev) => {
      const newItems = prev.map((itm, i) =>
        i === index
          ? option
            ? {
                ...itm,
                itemSearch: option.label,
                item_uom_option_id: option.value,
                selectedItem: option.item,
              }
            : {
                ...itm,
                itemSearch: '',
                item_uom_option_id: '',
                selectedItem: undefined,
              }
          : itm
      );

      if (index === prev.length - 1 && option?.value) {
        newItems.push({ itemSearch: '', item_uom_option_id: '', quantity: 1 });
        setSearchTerms((prevTerms) => [...prevTerms, '']);
      }

      return newItems;
    });
  };

  const handleQuantityChange = (index: number, value: string) => {
    const qty = Math.max(1, Number(value) || 1);

    setItems((prev) => {
      const newItems = prev.map((itm, i) =>
        i === index ? { ...itm, quantity: qty } : itm
      );

      if (index === prev.length - 1 && qty > 0 && prev[index].item_uom_option_id) {
        newItems.push({ itemSearch: '', item_uom_option_id: '', quantity: 1 });
        setSearchTerms((prevTerms) => [...prevTerms, '']);
      }

      return newItems;
    });
  };

  const handleSearchInputChange = (index: number, inputValue: string) => {
    setSearchTerms((prev) => {
      const newTerms = [...prev];
      newTerms[index] = inputValue;
      return newTerms;
    });
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSearchTerms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Clean trailing empty rows
    let validItems = [...items];
    while (validItems.length > 0) {
      const last = validItems[validItems.length - 1];
      if (!last.item_uom_option_id && last.quantity === 1 && !last.itemSearch?.trim()) {
        validItems.pop();
      } else {
        break;
      }
    }

    if (validItems.length === 0) {
      toast.error('No items selected. Please add at least one item.');
      return;
    }

    const incomplete = validItems.filter(
      (i) => !i.item_uom_option_id || i.quantity <= 0
    );

    if (incomplete.length > 0) {
      toast.error('Some items are incomplete. Please select an item or remove the row.');
      return;
    }

    const payload = {
      outlet_id: outletId,                        // required
      outlet_sales_channel_id: channelId,         // required
      customer_id: null,                          // optional
      items: validItems.map((i) => ({
        item_uom_option_id: i.item_uom_option_id,
        quantity: i.quantity,
      })),
      is_complimentary: isComplimentary,
      is_credit: isCredit,
      payment_method_code: selectedPaymentMethod || null,
      reference_number: referenceNumber.trim() || null,
    };
    await onSubmit(payload);
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900">
      <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-y-auto p-6">
        {step === 1 ? (
          <div className="space-y-6 w-full">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Select Waiter / Walk-in
            </h2>
            <div className="flex flex-wrap gap-4">
              {waiters.map((waiter) => (
                <button
                  key={waiter.value}
                  onClick={() => handleSelectWaiter(waiter)}
                  className={clsx(
                    'group flex flex-col items-center justify-center p-6 w-48',
                    'border border-neutral-200 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-900',
                    'transition-all duration-200 hover:border-primary hover:shadow-sm hover:scale-[1.03]'
                  )}
                >
                  <div
                    className={clsx(
                      'w-14 h-14 rounded-full flex items-center justify-center',
                      'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300',
                      'group-hover:text-primary transition-colors'
                    )}
                  >
                    {waiter.isWalkIn ? <PersonStanding size={26} strokeWidth={2} /> : <User size={26} strokeWidth={2} />}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 text-center">
                    {waiter.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10 w-full">
            <div className="flex-1 space-y-8">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                  Bill Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <h3 className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-3">
                  Items
                </h3>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const hasValue = !!item.item_uom_option_id;

                    return (
                      <div
                        key={index}
                        className={clsx(
                          'group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border',
                          hasValue
                            ? 'bg-neutral-50/70 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 hover:border-primary/60'
                            : 'bg-neutral-50/40 dark:bg-neutral-900/30 border-dashed border-neutral-300 dark:border-neutral-700'
                        )}
                      >
                        <div className="flex-1 min-w-[240px]">
                          <Select
                            isClearable
                            isSearchable
                            placeholder="Search item..."
                            value={
                              item.selectedItem
                                ? {
                                    value: item.item_uom_option_id,
                                    label: item.itemSearch,
                                    item: item.selectedItem,
                                  }
                                : null
                            }
                            options={itemOptions}
                            onChange={(opt) => handleItemChange(index, opt)}
                            onInputChange={(val) => handleSearchInputChange(index, val)}
                            isLoading={isLoading && shouldFetch}
                            className="text-sm"
                            classNames={{
                              control: ({ isFocused, isDisabled }) =>
                                clsx(
                                  '!min-h-[38px] !text-sm transition-colors',
                                  '!border !rounded-lg',
                                  '!border-neutral-300 dark:!border-neutral-600',
                                  '!bg-white dark:!bg-neutral-800',
                                  'hover:!border-primary/60',
                                  isFocused && '!border-primary/80 !ring-2 !ring-primary/30',
                                  isDisabled && '!bg-neutral-100 dark:!bg-neutral-800 !cursor-not-allowed !opacity-70'
                                ),
                              menu: () =>
                                clsx(
                                  'dark:!bg-neutral-800 dark:!border-neutral-700',
                                  '!border !border-neutral-300 dark:!border-neutral-600',
                                  '!rounded-lg !shadow-lg !text-sm !mt-1 z-[999]'
                                ),
                              menuList: () => '!p-1 dark:!text-neutral-100',
                              option: ({ isFocused, isSelected }) =>
                                clsx(
                                  '!px-3 !py-2 !text-sm !cursor-pointer',
                                  'dark:!text-neutral-100',
                                  isSelected
                                    ? '!bg-primary/20 !text-primary dark:!bg-primary/30'
                                    : isFocused
                                    ? '!bg-neutral-100 dark:!bg-neutral-700'
                                    : '!bg-transparent'
                                ),
                              singleValue: () => '!text-neutral-900 dark:!text-neutral-100',
                              placeholder: () => '!text-neutral-500 dark:!text-neutral-400',
                              clearIndicator: () =>
                                '!text-neutral-400 hover:!text-red-500 dark:!text-neutral-500 dark:hover:!text-red-400',
                              dropdownIndicator: () =>
                                '!text-neutral-500 dark:!text-neutral-400 hover:!text-primary',
                              loadingIndicator: () => '!text-primary',
                              noOptionsMessage: () => '!text-neutral-500 dark:!text-neutral-400 !py-2',
                            }}
                            styles={{
                              control: (base) => ({
                                ...base,
                                borderRadius: '0.5rem',
                                boxShadow: 'none',
                              }),
                              menu: (base) => ({
                                ...base,
                                zIndex: 9999,
                                marginTop: '4px',
                              }),
                            }}
                          />
                        </div>


                        <div className="w-32 flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = Math.max(1, item.quantity - 1);
                              handleQuantityChange(index, String(newQty));
                            }}
                            disabled={item.quantity <= 1}
                            className={clsx(
                              'w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                              item.quantity <= 1
                                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                            )}
                          >
                            -
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={clsx(
                              'w-12 text-center text-sm font-medium border rounded-md py-1.5',
                              'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600',
                              'focus:border-primary focus:ring-1 focus:ring-primary/50',
                              'appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                            )}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const newQty = item.quantity + 1;
                              handleQuantityChange(index, String(newQty));
                            }}
                            className={clsx(
                              'w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                              'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                            )}
                          >
                            +
                          </button>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className={clsx(
                              'absolute -right-2 -top-2 p-1.5 rounded-full',
                              'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600',
                              'text-neutral-500 hover:text-red-600 hover:border-red-300',
                              'opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm hover:shadow'
                            )}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-px bg-neutral-200 dark:bg-neutral-800 self-stretch" />

            <div className="flex-1 space-y-8 lg:pl-8">
              <div className="space-y-4 bg-neutral-50 dark:bg-neutral-800/50 p-5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300">
                    <span>Subtotal</span>
                    <span className="font-medium">KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-300">
                    <span>Tax (16%)</span>
                    <span className="font-medium">KES {(subtotal * 0.16).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-neutral-900 dark:text-white pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <span>Total</span>
                    <span>KES {(subtotal * 1.16).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* New: Complimentary / Credit checkboxes + Reference */}
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isComplimentary"
                      checked={isComplimentary}
                      onChange={(e) => setIsComplimentary(e.target.checked)}
                      className="h-5 w-5 rounded border-neutral-300 text-primary focus:ring-primary dark:border-neutral-600 dark:bg-neutral-800"
                    />
                    <label
                      htmlFor="isComplimentary"
                      className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Is Complimentary (No Charge)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCredit"
                      checked={isCredit}
                      onChange={(e) => setIsCredit(e.target.checked)}
                      className="h-5 w-5 rounded border-neutral-300 text-primary focus:ring-primary dark:border-neutral-600 dark:bg-neutral-800"
                    />
                    <label
                      htmlFor="isCredit"
                      className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      Is Credit (Deferred Payment)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                    Reference Number (M-Pesa Ref / Customer No.)
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. QH123456789 or 0712345678"
                    className="w-full px-4 py-2.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Payment Method (optional)
                </label>
                <div className="flex flex-wrap gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.code}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.code)}
                      className={clsx(
                        'px-6 py-2.5 rounded-lg text-sm font-medium transition-all',
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
        )}
      </div>

      <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
        {step === 2 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft size={20} />
            Back
          </button>
        )}

        <div className="flex justify-end gap-4 flex-1">
          <button
            type="button"
            className="px-6 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>

          {step === 2 && (
            <button
              type="button"
              onClick={handleSave}
              className="px-8 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Create Bill
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBillForm;