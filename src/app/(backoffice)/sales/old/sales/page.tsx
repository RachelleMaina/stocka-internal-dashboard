// app/backoffice/sales/page.tsx
"use client";

import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import PageEmptyState from "@/components/common/EmptyPageState";
import { FilterBar } from "@/components/common/FilterBar";
import PageSkeleton from "@/components/common/PageSkeleton";
import { Permission } from "@/components/common/Permission";
import ReusableTable from "@/components/common/ReusableTable";
import { routes } from "@/constants/routes";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import { formatNumber } from "@/lib/utils/helpers";
import { useMemo, useState, useEffect } from "react";
import { Minus, Plus, Search, User, X, RefreshCw, Eye, ChevronDown, ChevronUp, Printer, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import { endpoints } from "@/constants/endpoints";
import EtimsReceipt from "@/components/common/EtimsReceipt";

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [etimsRegistered, setEtimsRegistered] = useState<any>(null);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<any>(null);
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [totalCartAmount, setTotalCartAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [saleDate, setSaleDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("01");
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);
  const [buyerPin, setBuyerPin] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { backoffice_user_profile } = useAppState();
  const storeLocationId = backoffice_user_profile?.store_location_id;
  const businessLocationId = backoffice_user_profile?.business_location_id;
  const user_id = backoffice_user_profile?.id;
  const router = useRouter();

  const businessInfo = {
    name: backoffice_user_profile?.business_name || "Your Business Name",
    pin: backoffice_user_profile?.business_pin || "P051123456A",
    address: backoffice_user_profile?.business_address || "Your Business Address",
    logoUrl: backoffice_user_profile?.business_logo_url || "",
  };

  const paymentMethodsOptions = [
    { value: "01", label: "CASH" },
    { value: "02", label: "CREDIT" },
    { value: "03", label: "CASH/CREDIT" },
    { value: "04", label: "BANK CHECK" },
    { value: "05", label: "DEBIT & CREDIT CARD" },
    { value: "06", label: "MOBILE MONEY" },
    { value: "07", label: "OTHER" },
  ];

  // === FETCH SALES ===
  const fetchSales = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.post(endpoints.getSales(), {
        page,
        limit: pagination.limit,
        status: status?.value || null,
        etims_registered: etimsRegistered?.value || null,
        search,
        business_location_id: businessLocationId,
        store_location_id: storeLocationId,
      });
      const { data, pagination: pag } = response?.data?.data || {};
      setSales(data || []);
      setPagination(pag || pagination);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleDetails = async (saleId: string) => {
    try {
      const response = await api.get(endpoints.getSaleById?.(storeLocationId, saleId) || `/sales/${saleId}`);
      return response.data.data;
    } catch (error: any) {
      toast.error("Failed to fetch sale details");
      return null;
    }
  };

  const handleViewReceipt = async (sale: any) => {
  
      setSelectedSaleForReceipt(sale);
      setIsReceiptOpen(true);
    
  };

  const handleRetryEtims = async (saleId: string) => {
    try {
      await api.post(endpoints.retryEtimsSale?.(storeLocationId, saleId) || `/sales/${saleId}/retry-etims`, {
        business_location_id: businessLocationId,
      });
      toast.success("eTIMS retry submitted successfully");
      fetchSales(pagination.currentPage);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to retry eTIMS");
    }
  };

  // === LOAD OPTIONS ===
  const loadItems = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const response = await api.get(endpoints.getSellableItems(storeLocationId), {
        params: { search: inputValue, business_location_id: businessLocationId },
      });
      return response.data.data.map((item: any) => ({
        value: item.id,
        label: `${item.item_name} - (Stock: ${item.stock_quantity || 0})`,
        item: {
          ...item,
          qty_unit_cd: item.qty_unit_cd || 'U',
          pkg_unit_cd: item.pkg_unit_cd || null,
          hs_code: item.hs_code || null,
          item_type: item.is_service ? 'SERVICE' : 'GOODS',
          tax_type: { code: item.item_tax_type_code || 'B', name: item.item_tax_type_name || 'Standard Rate' },
        },
      }));
    } catch (error) {
      console.error('Failed to fetch items:', error);
      return [];
    }
  };

  const loadCustomers = async (inputValue: string) => {
    if (!inputValue) return [];
    try {
      const response = await api.get(endpoints.getCustomers(businessLocationId), {
        params: { search: inputValue },
      });
      return response.data.data.map((cust: any) => ({
        value: cust.id,
        label: `${cust.customer_name} (${cust.kra_pin || 'No PIN'})`,
        customer: cust,
      }));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      return [];
    }
  };

  useEffect(() => {
    if (storeLocationId) {
      fetchSales(1);
    }
  }, [storeLocationId, status?.value, etimsRegistered?.value, search]);

  const handlePageChange = (page: number) => fetchSales(page);
  const handleSearchChange = (term: string) => { setSearch(term); setPagination(p => ({ ...p, currentPage: 1 })); };
  const handleStatusChange = (v: any) => { setStatus(v); setPagination(p => ({ ...p, currentPage: 1 })); };
  const handleEtimsChange = (v: any) => { setEtimsRegistered(v); setPagination(p => ({ ...p, currentPage: 1 })); };

  // === MODAL CONTROLS ===
  const openCreateModal = () => {
    setCart([]);
    setSelectedCustomer(null);
    setSelectedItem(null);
    setCurrentQuantity(1);
    setCurrentPrice(0);
    setTotalCartAmount(0);
    setTaxAmount(0);
    setSaleDate(null);
    setNotes("");
    setPaymentMethod("01");
    setIsComplimentary(false);
    setServiceChargeRate(0);
    setBuyerPin("");
    setShowAdvanced(false);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => setIsCreateOpen(false);

  // === CART LOGIC ===
  const addToCart = () => {
    if (!selectedItem || currentQuantity <= 0) {
      toast.error("Select an item and enter quantity.");
      return;
    }

    if (selectedItem.item.stock_quantity < (selectedItem.item.low_stock_threshold || 0)) {
      toast.error(`"${selectedItem.item.item_name}" is low on stock.`);
      return;
    }

    const existing = cart.find(c => c.item.id === selectedItem.item.id);
    const price = currentPrice || selectedItem.item.selling_price;
    const { taxable_amount, tax_amount, total_amount } = calculateItemTotals({
      quantity: currentQuantity,
      unit_price: price,
      tax_type_code: selectedItem.item.tax_type?.code || 'B',
    }, false);

    if (existing) {
      const newQty = existing.quantity + currentQuantity;
      const updated = calculateItemTotals({ quantity: newQty, unit_price: price, tax_type_code: existing.item.tax_type?.code || 'B' }, false);
      setCart(prev => prev.map(c =>
        c.item.id === selectedItem.item.id
          ? { ...c, quantity: newQty, taxable_amount: updated.taxable_amount, tax_amount: updated.tax_amount, total_amount: updated.total_amount }
          : c
      ));
      toast.success(`Added ${currentQuantity} more`);
    } else {
      setCart(prev => [...prev, {
        item: selectedItem.item,
        quantity: currentQuantity,
        price,
        taxable_amount,
        tax_amount,
        total_amount,
      }]);
      toast.success(`Added ${currentQuantity} x ${selectedItem.item.item_name}`);
    }

    setSelectedItem(null);
    setCurrentQuantity(1);
    setCurrentPrice(0);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.item.id !== id));
    toast.success("Item removed");
  };

  const updateCartQuantity = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    const item = cart.find(c => c.item.id === id);
    if (!item) return;
    const updated = calculateItemTotals({
      quantity: qty,
      unit_price: item.price,
      tax_type_code: item.item.tax_type?.code || 'B',
    }, false);
    setCart(prev => prev.map(c => c.item.id === id ? { ...c, quantity: qty, ...updated } : c));
  };

  const calculateItemTotals = (item: { quantity: number; unit_price: number; tax_type_code?: string }, isExempt: boolean) => {
    const { quantity, unit_price, tax_type_code = 'B' } = item;
    const taxRate = tax_type_code === 'B' ? 16 : tax_type_code === 'E' ? 8 : 0;
    const taxDecimal = taxRate / 100;
    const lineTotal = quantity * unit_price;

    if (isExempt || taxRate === 0) {
      return { taxable_amount: lineTotal, tax_amount: 0, total_amount: lineTotal };
    }

    const exclusive = Math.round((lineTotal / (1 + taxDecimal)) * 100) / 100;
    const tax = Math.round((lineTotal - exclusive) * 100) / 100;
    return { taxable_amount: exclusive, tax_amount: tax, total_amount: lineTotal };
  };

  useEffect(() => {
    let total = 0, tax = 0;
    cart.forEach(c => { total += c.taxable_amount; tax += c.tax_amount; });
    setTotalCartAmount(total);
    setTaxAmount(tax);
  }, [cart]);

  // === SUBMIT SALE ===
  const handleSubmitSale = async () => {
    if (cart.length === 0) return toast.error("Cart is empty.");

    const isCreditOrComplimentary = paymentMethod === "02" || isComplimentary;
    if (isCreditOrComplimentary && !selectedCustomer) {
      return toast.error("Customer is required for credit or complimentary sales.");
    }

    const payload = {
      business_location_id: businessLocationId,
      store_location_id: storeLocationId,
      sale_date: saleDate || new Date(),
      customer_id: selectedCustomer?.value || null,
      buyer_pin: buyerPin || selectedCustomer?.customer?.kra_pin || null,
      payment_method: paymentMethod,
      items: cart.map(c => ({
        item_id: c.item.id,
        quantity: c.quantity,
        unit_price: c.price,
        discount_rate: 0,
        package_unit_quantity: c.item.package_unit_quantity || null,
        tax_type_code: c.item.tax_type?.code || 'B',
        qty_unit_cd: c.item.qty_unit_cd || 'U',
        pkg_unit_cd: c.item.pkg_unit_cd || null,
        hs_code: c.item.hs_code || null,
        item_type: c.item.item_type || 'GOODS',
      })),
      notes,
      user_id,
      is_complimentary: isComplimentary,
      is_credit: paymentMethod === "02",
      receipt_type_name: "Sales Receipt",
      receipt_type_code: "S",
      service_charge_rate: serviceChargeRate,
    };

    try {
      const response = await api.post(endpoints.submitSale?.(storeLocationId) || `/sales`, payload);
      toast.success(response.data.message || "Sale submitted!");
      closeCreateModal();
      fetchSales(pagination.currentPage);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit sale");
    }
  };

  // === TABLE COLUMNS ===
  const columns = useMemo(() => [
    { key: "receipt", label: "Receipt #", render: (s: any) => <span>{s.receipt_number}</span> },
    {
      key: "customer", label: "Customer",
      render: (s: any) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <span>{s.customer_name || 'Walk-in'}</span>
        </div>
      )
    },
    { key: "total", label: "Total (Ksh.)", render: (s: any) => <span>{formatNumber((s.total_amount || 0) + (s.tax_amount || 0))}</span> },
    {
      key: "etims", label: "eTIMS", align: "center",
      render: (s: any) => !s.is_etims_registered ? (
        <span className="text-xs text-red-600 flex items-center gap-1">
          Not Registered
          <button onClick={() => handleRetryEtims(s.id)} title="Retry" className="p-1 hover:bg-red-50 rounded">
            <RefreshCw className="w-3 h-3" />
          </button>
        </span>
      ) : <span className="text-xs text-green-600">Registered</span>
    },
    { key: "date", label: "Date", render: (s: any) => new Date(s.sale_date).toLocaleDateString() },
    {
      key: "actions", label: "Actions",
      render: (s: any) => (
        <div className="flex gap-2">
          <Permission resource="sales" action="read">
            <button onClick={() => handleViewReceipt(s)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="View">
              <Eye className="w-4 h-4" />
            </button>
          </Permission>
        </div>
      )
    },
  ], [sales]);

  if (loading) return <PageSkeleton />;

  return (
    <Permission resource="sales" action="read" isPage={true}>
      <div className="h-full">
        <BreadcrumbWithActions
          label="Sales"
          breadcrumbs={[
            { name: "Sales", onClick: () => router.push(routes.sales) },
            { name: "All Sales" },
          ]}
          actions={[
            {
              title: "New Sale",
              icon: <Plus className="w-4 h-4" />,
              onClick: openCreateModal,
              resource: "sales",
              action: "create",
            },
          ]}
        />

        <div className="p-3 bg-white dark:bg-neutral-900 md:m-2">
          <div className="p-3">
            <FilterBar
              searchQuery={search}
              onSearchChange={handleSearchChange}
              additionalFilters={[
                {
                  type: "select", label: "Status",
                  options: [{ value: true, label: "Active" }, { value: false, label: "Inactive" }],
                  onChange: handleStatusChange,
                },
                {
                  type: "select", label: "eTIMS",
                  options: [{ value: true, label: "Registered" }, { value: false, label: "Not Registered" }],
                  onChange: handleEtimsChange,
                },
              ]}
            />
          </div>

          {sales.length > 0 ? (
            <ReusableTable
              data={sales}
              columns={columns}
              pageSize={pagination.limit}
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          ) : (
            <PageEmptyState icon={Search} description="No sales found." />
          )}
        </div>

        {/* === NEW SALE MODAL === */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-semibold">New Sale</h2>
                <button onClick={closeCreateModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left: Item + Payment */}
                  <div className="space-y-6">
                    {/* Item Search */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Search Item</label>
                      <AsyncSelect
                        cacheOptions
                        loadOptions={loadItems}
                        value={selectedItem}
                        onChange={(opt: any) => {
                          if (opt) {
                            setSelectedItem(opt);
                            setCurrentPrice(opt.item.selling_price);
                            setCurrentQuantity(1);
                          } else {
                            setSelectedItem(null);
                            setCurrentQuantity(1);
                            setCurrentPrice(0);
                          }
                        }}
                        placeholder="Type to search items..."
                        classNamePrefix="react-select"
                        styles={{ control: (p) => ({ ...p, minHeight: 44 }) }}
                      />
                    </div>

                    {selectedItem && (
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-xs text-gray-600">Quantity</label>
                          <input
                            type="number"
                            value={currentQuantity}
                            onChange={(e) => setCurrentQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            min="1"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-600">Price</label>
                          <input
                            type="number"
                            value={currentPrice}
                            onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            step="0.01"
                          />
                        </div>
                        <button
                          onClick={addToCart}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Add
                        </button>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Payment Method</label>
                      <Select
                        options={paymentMethodsOptions}
                        value={paymentMethodsOptions.find(o => o.value === paymentMethod)}
                        onChange={(opt) => setPaymentMethod(opt?.value || "01")}
                        classNamePrefix="react-select"
                        styles={{ control: (p) => ({ ...p, minHeight: 44 }) }}
                      />
                    </div>

                    {/* Advanced Accordion */}
                    <div className="border-t pt-4">
                      <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Advanced Options
                      </button>

                      {showAdvanced && (
                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2">
 allant
                          {/* Customer */}
                          <div>
                            <label className="text-sm font-medium flex items-center gap-1">
                              Customer {isComplimentary || paymentMethod === "02" ? <span className="text-red-500">*</span> : ""}
                            </label>
                            <AsyncSelect
                              cacheOptions
                              loadOptions={loadCustomers}
                              value={selectedCustomer}
                              onChange={setSelectedCustomer}
                              placeholder="Search customer..."
                              isClearable
                              classNamePrefix="react-select"
                              styles={{ control: (p) => ({ ...p, minHeight: 40 }) }}
                            />
                          </div>

                          {/* Buyer PIN */}
                          <div>
                            <label className="text-sm font-medium">Buyer PIN (Optional)</label>
                            <input
                              type="text"
                              value={buyerPin}
                              onChange={(e) => setBuyerPin(e.target.value)}
                              placeholder="KRA PIN"
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>

                          {/* Sale Date */}
                          <div>
                            <label className="text-sm font-medium">Sale Date</label>
                            <input
                              type="datetime-local"
                              value={saleDate ? saleDate.toISOString().slice(0, 16) : ""}
                              onChange={(e) => setSaleDate(e.target.value ? new Date(e.target.value) : null)}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>

                          {/* Service Charge */}
                          <div>
                            <label className="text-sm font-medium">Service Charge (%)</label>
                            <input
                              type="number"
                              value={serviceChargeRate}
                              onChange={(e) => setServiceChargeRate(parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="text-sm font-medium">Notes</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={2}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>

                          {/* Complimentary */}
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isComplimentary}
                              onChange={(e) => setIsComplimentary(e.target.checked)}
                            />
                            <span className="text-sm">Complimentary Sale</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Cart Summary */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold">Cart ({cart.length})</h3>
                    <div className="max-h-96 overflow-y-auto border rounded-xl p-4 bg-gray-50 space-y-3">
                      {cart.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Cart is empty</p>
                      ) : (
                        cart.map(c => (
                          <div key={c.item.id} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                            <div>
                              <p className="font-medium text-sm">{c.item.item_name}</p>
                              <p className="text-xs text-gray-600">{c.quantity} × {formatNumber(c.price)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateCartQuantity(c.item.id, c.quantity - 1)} className="p-1 hover:bg-gray-100 rounded">
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{c.quantity}</span>
                              <button onClick={() => updateCartQuantity(c.item.id, c.quantity + 1)} className="p-1 hover:bg-gray-100 rounded">
                                <Plus className="w-4 h-4" />
                              </button>
                              <button onClick={() => removeFromCart(c.item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t pt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal (excl. VAT):</span>
                        <span>{formatNumber(totalCartAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT:</span>
                        <span>{formatNumber(taxAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Charge:</span>
                        <span>{formatNumber(totalCartAmount * (serviceChargeRate / 100))}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total:</span>
                        <span>{formatNumber(totalCartAmount + taxAmount + (totalCartAmount * (serviceChargeRate / 100)))}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitSale}
                      disabled={cart.length === 0}
                      className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Submit Sale
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

{isReceiptOpen && selectedSaleForReceipt && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
      
      {/* === FIXED HEADER === */}
      <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center p-4">
        <h2 className="text-xl font-bold">
          Receipt - {selectedSaleForReceipt.receipt_number}
        </h2>
        <div className="flex items-center gap-2">
          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Print"
          >
            <Printer className="w-5 h-5" />
          </button>

          {/* Share to WhatsApp */}
          <button
            onClick={() => {
              const publicUrl = `${window.location.origin}/receipt/${selectedSaleForReceipt.id}`;
              const message = encodeURIComponent(
                `Here's your receipt from *${businessInfo.name}*\n\nInvoice: ${selectedSaleForReceipt.receipt_number}\nTotal: KES ${formatNumber(
                  selectedSaleForReceipt.total_amount + selectedSaleForReceipt.tax_amount
                )}\n\nView full receipt:\n${publicUrl}`
              );
              window.open(`https://wa.me/?text=${message}`, "_blank");
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
            title="Share on WhatsApp"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Close */}
          <button
            onClick={() => setIsReceiptOpen(false)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <EtimsReceipt
          etimsDetails={selectedSaleForReceipt.etims_details}
          businessInfo={businessInfo}
          saleInfo={{
            receipt_number: selectedSaleForReceipt.receipt_number,
            sale_date: selectedSaleForReceipt.sale_date,
            customer_name: selectedSaleForReceipt.customer_name,
            total_amount: selectedSaleForReceipt.total_amount,
            tax_amount: selectedSaleForReceipt.tax_amount,
          }}
          items={selectedSaleForReceipt.items || []}
          payments={selectedSaleForReceipt.payments || []}
        />
      </div>
    </div>
  </div>
)}
      </div>
    </Permission>
  );
}