"use client";

import { useAppState } from "@/lib/context/AppState";
import { useCart } from "@/lib/context/CartContext";
import {
  saveSaleService
} from "@/lib/services/saleServices";
import { formatNumber } from "@/lib/utils/helpers";
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  HandCoins,
  Loader,
  Smartphone,
  Split,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import ModalHeader from "../common/ModalHeader";

const paymentMethods = [
  { value: "mpesa", label: "M-Pesa", icon: Smartphone },
  { value: "cash", label: "Cash", icon: HandCoins },
  { value: "card", label: "Card", icon: CreditCard },
];

const cashPresets = [50, 100, 200, 500, 1000];

interface SplitAmounts {
  cash: string;
  mpesa: string;
  card: string;
}
export default function PaymentPane({ onClose}) {
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [amountTendered, setAmountTendered] = useState("");
  const [activeMethod, setActiveMethod] = useState<keyof SplitAmounts | null>(
    null
  );
    const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState<SplitAmounts>({
    cash: "",
    mpesa: "",
    card: "",
  });
  const { dispatch, pos_user_profile, pos_device_profile } = useAppState();

  const { clearCart, cart } = useCart();

  const [isFullScreen, setIsFullScreen] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const discount = 0;
  const total = subtotal - discount;

  const changeDue = useMemo(() => {
    const tendered = parseFloat(amountTendered || "0");
    return tendered > total ? tendered - total : 0;
  }, [amountTendered, total]);

  const isChargeDisabled =
    parseFloat(amountTendered || "0") < total || total == 0;
  const isChargeOnSplitDisabled = !Object.values(splitAmounts).some(
    (value) => value && parseFloat(value) > 0
  );
  const isSplitDisabled = total == 0;

  useEffect(() => {
    setAmountTendered(total);
  }, [JSON.stringify(cart)]);

  const onCharge = async (payments?: any) => {
  
    if (pos_user_profile) {

      try {
        setLoading(true)
        const businessLocationId = pos_user_profile.business_location_id;
        const storeLocationId = pos_device_profile.active_store_location_id;

        const user = {
          id: pos_user_profile.user_id,
          user_name: `${pos_user_profile.first_name} ${pos_user_profile.last_name}`,
          email: pos_user_profile.email || null,
          phone: pos_user_profile.phone || null,
        };
        const notes = "";
       
        const paymentDetails = payments || [
          {
            method: paymentMethod,
            amount: parseFloat(amountTendered),
          },
        ];
        const receipt_prefix = null;

     await saveSaleService(
          businessLocationId,
          storeLocationId,
          user,
          notes,
          changeDue,
          paymentDetails,
          cart,
          receipt_prefix
        );

        setAmountTendered("");
        clearCart();
        dispatch({
          type: "POS_PAYMENTPANE_TOGGLE",
          show_pos_payment_pane: false,
        });
        onClose?.()
  
        toast.success("Sale recorded successfully.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to create sale.");
      } finally {
              setLoading(false)
      }
    }
  };

  // Mobile: Toggle full screen for the payment panel
  const handleTogglePaymentPanel = () => setIsFullScreen(!isFullScreen);

  // Handle split payment charge
  const handleSplitCharge = () => {
    const payments = [
      { method: "cash", amount: splitAmounts.cash },
      { method: "mpesa", amount: splitAmounts.mpesa },
      { method: "bank", amount: splitAmounts.card },
    ].filter((p) => p.amount && Number(p.amount) > 0);

    if (payments.length === 0) {
      setError("Please enter at least one valid amount.");
      return;
    }

    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p?.amount ?? 0),
      0
    );

    if (totalPaid !== total) {
      setError("Split amount  must equal total price of items bought.");
      return;
    }

    onCharge(payments);
    setIsSplitMode(false);
    setSplitAmounts({ cash: "", mpesa: "", card: "" });
  };

  const onCloseSplitModal = () => {
    setIsSplitMode(false);
    setSplitAmounts({ cash: "", mpesa: "", bank: "" });
    setActiveMethod(null);
    setError("");
  };

  return (
    <>
      {/* Overlay on mobile */}
      {isFullScreen && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={handleTogglePaymentPanel}
        />
      )}

      {/* Payment Panel */}
      <div
        className={`w-full h-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-2 flex flex-col gap-2 transition-all duration-300 ease-in-out ${
          isFullScreen ? " inset-0 md:w-1/3 md:static" : "w-full"
        } md:top-0`}
      >
        {/* Customer Selector */}
        {/* <div className="w-full">
        <CreateAsyncSelect
          fetchUrl="/api/customers"
          value={selectedCustomer}
          onChange={(val) => setSelectedCustomer(val)}
          onCreate={onAddCustomer} // Assuming this is handled
        />
      </div> */}

        <div className="bg-white dark:bg-neutral-800 p-3 rounded text-sm space-y-1">
      
          {/* <div className="flex justify-between md:hidden">
            <span>Subtotal</span>
            <span>Ksh. {formatNumber(subtotal)}</span>
          </div>

         
          <div className="flex justify-between md:hidden">
            <span>Discount</span>
            <span>Ksh. {formatNumber(discount)}</span>
          </div> */}

          {/* Total - always shown */}
          <div className=" dark:border-neutral-600 flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>Ksh. {formatNumber(total)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-neutral-800 p-3 rounded">
          <label className="block text-sm mb-2 font-medium">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isActive = paymentMethod === method.value;
              return (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex items-center justify-center gap-2 px-2 py-2 rounded text-sm font-medium  transition-colors
                ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-neutral-200 dark:bg-neutral-700"
                }`}
                >
                  <Icon className="w-4 h-4" />
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Split Payment */}
          <button
            className="flex font-medium items-center justify-center gap-2 w-full py-2 text-sm bg-neutral-200 dark:bg-neutral-700 rounded"
            onClick={() => {
              setIsSplitMode(true);
            }}
            disabled={isSplitDisabled}
          >
            <Split className="w-4 h-4" />
            Split Payment
          </button>
        </div>
        {/* Amount Tendered */}
        {paymentMethod === "cash" && (
          <div className="bg-white dark:bg-neutral-800 p-3 rounded">
            <div>
              <label className="block text-sm mb-2 font-medium">
                Amount Tendered (Ksh.)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded border-2 border-neutral-300 dark:border-neutral-600  text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-5 gap-2 mt-2">
              {cashPresets.map((amt) => (
                <button
                  key={amt}
                  onClick={() =>
                    setAmountTendered((prev) =>
                      (parseFloat(prev || "0") + amt).toString()
                    )
                  }
                  className="font-medium px-1.5 py-1.5 text-xs rounded bg-neutral-200 dark:bg-neutral-700  text-center"
                >
                  +{amt}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center font-semibold text-sm mt-4">
              <span>Change:</span>
              <span className="text-primary">Ksh {changeDue.toFixed(0)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => onCharge()}
          disabled={isChargeDisabled || loading}
          className={`mt-auto w-full py-3 rounded font-semibold flex items-center justify-center gap-2 transition
          ${
            isChargeDisabled || loading
              ? "bg-neutral-400 dark:bg-neutral-700 text-neutral-300 cursor-not-allowed"
              : "bg-primary  text-white"
          }`}
        >
          
          Charge
        </button>
      </div>

      {/* Split Payment Modal */}
      {isSplitMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <ModalHeader title={"Split Payment"} onClose={onCloseSplitModal} />
            {error && (
              <p className="text-red-500 text-sm font-medium text-center mb-4 flex items-center  gap-2 animate-fade-in">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </p>
            )}

            <div className="flex gap-1 items-center font-semibold text-sm mb-3">
              <span> Remaining:</span>
              <span className="text-primary ">
                Ksh{" "}
                {parseFloat(
                  (
                    total -
                    Object.values(splitAmounts).reduce(
                      (sum, val) => sum + parseFloat(val || "0"),
                      0
                    )
                  ).toFixed(2)
                ).toLocaleString()}
              </span>
            </div>

            <div className="space-y-4 mb-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;

                return (
                  <div
                    key={method.value}
                    className="relative flex items-center gap-2"
                  >
                    {/* Icon + label prefix inside input */}
                    <div className="absolute left-3 pr-1 w-18 border-r border-neutral-300 dark:border-neutral-600; flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-300">
                      <Icon className="w-4 h-4 mr-1" />
                      {method.label}
                    </div>

                    <input
                      type="number"
                      inputMode="decimal"
                      className={`flex-1 pl-24 pr-3 py-2 rounded text-base bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary ${
                        activeMethod === method.value
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      value={splitAmounts[method.value] || ""}
                      onChange={(e) => {
                        setSplitAmounts((prev) => ({
                          ...prev,
                          [method.value]: e.target.value,
                        }));
                      }}
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex w-full  gap-2">
              <button
                onClick={onCloseSplitModal}
                className="flex-1 font-medium bg-neutral-200  p-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleSplitCharge}
                disabled={isChargeOnSplitDisabled}
              className={`mt-auto w-full py-2 rounded font-semibold flex items-center justify-center gap-2 transition
                        ${
                          isChargeOnSplitDisabled
                            ? "bg-primary/80 text-white cursor-not-allowed"
                            : "bg-primary text-white"
                        }`}
              >
              { isChargeOnSplitDisabled ? (
                        <>
                          <Loader className="animate-spin h-4 w-4" />
                          Loading...
                        </>
                      ) : (
                        "Charge"
                      )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
