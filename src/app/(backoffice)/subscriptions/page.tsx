"use client";
import BreadcrumbWithActions from "@/components/common/BreadcrumbWithActions";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PageEmptyState from "@/components/common/EmptyPageState";
import ModalHeader from "@/components/common/ModalHeader";
import PageSkeleton from "@/components/common/PageSkeleton";
import ReusableTable from "@/components/common/ReusableTable";
import { api } from "@/lib/api";
import { useAppState } from "@/lib/context/AppState";
import clsx from "clsx";
import { AlertTriangle, Info, Package, Star } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Plans() {
  const {
    business_profile,
    active_store_profile,
    backoffice_user_profile,
    dispatch,
    show_backoffice_sidebar,
  } = useAppState();
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    trial: {},
    subscription: {},
    lastPayment: null,
  });
  const [billingFrequencies, setBillingFrequencies] = useState({
    Basic: true,
    Standard: true,
    Premium: true,
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [proratedCost, setProratedCost] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isRenewDialogOpen, setRenewDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(
    backoffice_user_profile?.phone || ""
  );
  const [isSubscriptionActive, setIsSubscriptionActive] =
    useState<boolean>(false);

  const id = business_profile?.[0]?.business_location_id;

  const plans = [
    {
      name: "Basic",
      productLimit: 50,
      monthlyPrice: 500,
      quarterlyPrice: 1000,
      setupFee: 3000,
      description: "Up to 50 products, Ksh 20 per additional product",
      tier: 1,
    },
    {
      name: "Standard",
      productLimit: 200,
      monthlyPrice: 1000,
      quarterlyPrice: 2000,
      setupFee: 5000,
      description:
        "Up to 200 products, custom branding, Ksh 20 per additional product",
      tier: 2,
    },
    {
      name: "Premium",
      productLimit: 500,
      monthlyPrice: 2000,
      quarterlyPrice: 4000,
      setupFee: 8000,
      description:
        "Up to 500 products, full features, Ksh 20 per additional product",
      tier: 3,
    },
  ];

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       setLoading(true);
  //       const [statusResponse, invoicesResponse] = await Promise.all([
  //         api.get(`/api/subscription/${id}/check-status`),
  //         api.get(`/api/subscription/${id}/invoices`),
  //       ]);
  //       setSubscriptionStatus(statusResponse.data?.data?.data);
  //       const data = statusResponse.data?.data?.data;
  //       const isActive =
  //         (data?.trial?.daysRemaining != null &&
  //           Number(data.trial.daysRemaining) > 0) ||
  //         (data?.subscription?.daysRemaining != null &&
  //           Number(data.subscription.daysRemaining) > 0);
  //       setIsSubscriptionActive(isActive);
  //       setInvoices(invoicesResponse?.data?.data?.data);
  //     } catch (error) {
  //       console.error("Failed to fetch data:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   if (id) fetchData();
  // }, [id]);

  const handleCalculateCost = async (plan) => {
    const currentPlanTier =
      plans.find((p) => p.name === subscriptionStatus.subscription.planName)
        ?.tier || 0;
    if (plan.name === subscriptionStatus.subscription.planName) {
      toast.error("You are already on this plan");
      return;
    }
    if (
      !subscriptionStatus.trial.status === "active" &&
      currentPlanTier >= plan.tier
    ) {
      toast.error("Cannot switch to a lower-tier plan");
      return;
    }
    try {
      setLoading(true);
      let cost = null;
      if (subscriptionStatus.trial.status !== "active") {
        const response = await api.post(
          `/api/subscription/${id}/calculate-switch-cost`,
          {
            businessLocationId: id,
            price_per_month: billingFrequencies[plan.name]
              ? plan.monthlyPrice
              : plan.quarterlyPrice / 3,
            billing_frequency: billingFrequencies[plan.name]
              ? "monthly"
              : "quarterly",
          }
        );
        cost = response.data?.data?.proratedAmount;
      } else {
        cost = billingFrequencies[plan.name]
          ? plan.monthlyPrice
          : plan.quarterlyPrice;
      }
      setProratedCost(cost);
      setSelectedPlan(plan);
    } catch (error) {
      console.error("Failed to calculate cost:", error);
      toast.error("Failed to calculate cost");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!selectedPlan || !phoneNumber || !proratedCost) {
      toast.error("Please provide a valid phone number and amount");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/api/subscription/${id}/stk-push`, {
        phoneNumber,
        amount: proratedCost,
        accountNumber: subscriptionStatus.accountNumber,
        invoiceNumber: `INV-${
          Math.max(
            ...invoices.map((i) => parseInt(i.billing_invoice_number || "0")),
            0
          ) + 1
        }`,
      });
      if (response.data?.data) {
        await api.patch(`/api/subscription/${id}`, {
          businessLocationId: id,
          plan_id: `${selectedPlan.name.toLowerCase()}-1`,
          plan_name: selectedPlan.name,
          product_limit: selectedPlan.productLimit,
          price_per_month: billingFrequencies[selectedPlan.name]
            ? selectedPlan.monthlyPrice
            : selectedPlan.quarterlyPrice / 3,
          billing_frequency: billingFrequencies[selectedPlan.name]
            ? "monthly"
            : "quarterly",
          installation_fee_paid: false,
        });
        setSubscriptionStatus((prev) => ({
          ...prev,
          trial: {},
          subscription: {
            planName: selectedPlan.name,
            status: "active",
            daysRemaining: billingFrequencies[selectedPlan.name] ? 30 : 90,
          },
        }));
        setSelectedPlan(null);
        setProratedCost(null);
        setIsPlanModalOpen(false);
        setPhoneNumber(backoffice_user_profile?.phone || "");
        toast.success("Payment initiated and subscription started");
      }
    } catch (error) {
      toast.error("Failed to start plan");
      console.error("Failed to create plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPlan = async () => {
    if (!selectedPlan || !phoneNumber || !proratedCost) {
      toast.error("Please provide a valid phone number and amount");
      return;
    }
    try {
      setLoading(true);
      const response = await api.post(`/api/subscription/${id}/stk-push`, {
        phoneNumber,
        amount: proratedCost,
        accountNumber: subscriptionStatus.accountNumber,
        invoiceNumber: `INV-${
          Math.max(
            ...invoices.map((i) => parseInt(i.billing_invoice_number || "0")),
            0
          ) + 1
        }`,
      });
      if (response.data?.data) {
        await api.patch(`/api/subscription/${id}`, {
          businessLocationId: id,
          plan_id: `${selectedPlan.name.toLowerCase()}-1`,
          plan_name: selectedPlan.name,
          product_limit: selectedPlan.productLimit,
          price_per_month: billingFrequencies[selectedPlan.name]
            ? selectedPlan.monthlyPrice
            : plan.quarterlyPrice / 3,
          billing_frequency: billingFrequencies[plan.name]
            ? "monthly"
            : "quarterly",
          installation_fee_paid: false,
        });
        setSubscriptionStatus((prev) => ({
          ...prev,
          subscription: {
            ...prev.subscription,
            planName: selectedPlan.name,
            status: "active",
          },
        }));
        toast.success("Payment initiated and subscription updated");
        setSelectedPlan(null);
        setProratedCost(null);
        setIsPlanModalOpen(false);
        setPhoneNumber(backoffice_user_profile?.phone || "");
      }
    } catch (error) {
      toast.error("Failed to switch plan");
      console.error("Failed to switch plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSTKPush = async () => {
    if (!subscriptionStatus.nextPayment.amount || !phoneNumber) {
      toast.error("Please provide a valid phone number and amount");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/api/subscription/${id}/stk-push`, {
        phoneNumber,
        amount: subscriptionStatus.nextPayment.amount,
        accountNumber: subscriptionStatus.accountNumber,
        invoiceNumber: `INV-${
          Math.max(
            ...invoices.map((i) => parseInt(i.billing_invoice_number || "0")),
            0
          ) + 1
        }`,
      });
      if (response.data?.data) {
        const renewResponse = await api.post(`/api/subscription/${id}/renew`);
        if (renewResponse.data?.data) {
          setSubscriptionStatus((prev) => ({
            ...prev,
            subscription: renewResponse.data.data.subscription,
          }));
          setInvoices((prev) => [renewResponse.data.data.invoice, ...prev]);
          toast.success("Payment initiated and subscription renewed");
        }
      }
    } catch (error) {
      toast.error("Failed to initiate payment");
      console.error("STK Push failed:", error);
    } finally {
      setLoading(false);
      setRenewDialogOpen(false);
      setPhoneNumber(backoffice_user_profile?.phone || "");
    }
  };

  const columns = [
    {
      key: "id",
      label: "Invoice Number",
      render: (invoice) => (
        <span className="text-xs text-neutral-800 dark:text-neutral-100">
          INV-{invoice.billing_invoice_number.toString().padStart(5, "0")}
        </span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (invoice) => (
        <span className="text-xs text-neutral-800 dark:text-neutral-100">
          {new Date(invoice.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (invoice) => (
        <span className="text-xs text-neutral-800 dark:text-neutral-100">
          KES {invoice.amount}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (invoice) => (
        <span
          className={clsx(
            "inline-block px-2 py-1 rounded text-xs font-medium",
            invoice.status === "Paid"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : invoice.status === "Pending"
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          )}
        >
          {invoice.status}
        </span>
      ),
    },
  ];

  const currentPlanTier =
    plans.find((p) => p.name === subscriptionStatus.subscription.planName)
      ?.tier || 0;
  const isTrial = subscriptionStatus.trial.status === "active";
  const endDate = new Date();
  endDate.setDate(
    endDate.getDate() +
      (subscriptionStatus.trial.daysRemaining ||
        subscriptionStatus.subscription.daysRemaining ||
        0)
  );
  const formattedEndDate = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="h-full">
      <div className="mb-3">
        <BreadcrumbWithActions
          label="Billing & Subscriptions"
          breadcrumbs={[{ name: "Billing & Subscriptions" }]}
        />
      </div>

      {!isSubscriptionActive ? (
        <div className="mx-3 mb-3 flex items-start gap-3 bg-red-50 dark:bg-red-900 border-l-4 border-red-500 dark:border-red-400 text-red-800 dark:text-red-100 p-4 rounded-md shadow-sm">
          <AlertTriangle className="w-5 h-5 mt-0.5 text-red-500 dark:text-red-300" />

          <div className="flex-1">
            <h2 className="text-sm font-semibold">
              Your Subscription Has Expired
            </h2>
            <p className="mt-1 text-sm leading-snug">
              Please renew to continue using the system without interruption.
            </p>

            {/* <button
              onClick={() => setRenewDialogOpen(true)}
              className="mt-3 inline-flex items-center gap-1 bg-primary text-white text-xs font-medium px-4 py-1.5 rounded-md transition"
            >
              Renew Now
            </button> */}
          </div>
        </div>
      ) : (
        <div className="mb-3 mx-2 grid gap-3 md:grid-cols-2">
          {/* Current Plan Summary */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-md">
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
              Current Plan
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Plan:
                </span>
                <span
                  className="font-medium text-neutr
al-800 dark:text-neutral-100"
                >
                  {isTrial
                    ? "Trial (All Features)"
                    : `${subscriptionStatus.subscription.planName} Plan`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Status:
                </span>
                <span className="font-medium text-neutral-800 dark:text-neutral-100">
                  Active –{" "}
                  {isTrial
                    ? `${subscriptionStatus.trial.daysRemaining} days remaining`
                    : `${subscriptionStatus.subscription.daysRemaining} days remaining`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">
                  Ends on:
                </span>
                <span className="font-medium text-neutral-800 dark:text-neutral-100">
                  {formattedEndDate}
                </span>
              </div>
            </div>
            {/* <button
            onClick={() => setIsPlanModalOpen(true)}
            className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-1.5 text-sm font-medium transition-colors duration-200"
            disabled={loading}
          >
            Upgrade
          </button> */}
          </div>

          {/* Next Payment (Hidden during Trial) */}
          {!isTrial && (
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-md">
              <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3 flex items-center gap-2">
                Next Payment
              </h3>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Amount Due:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    KES {subscriptionStatus?.nextPayment?.amount || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Payment Method:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    M-PESA Paybill
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Paybill Number:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    XXXXXX
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Account Number:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    {subscriptionStatus?.accountNumber || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Next Billing:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    {subscriptionStatus.subscription?.billingCycleEnd
                      ? new Date(
                          subscriptionStatus.subscription?.billingCycleEnd
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Last Payment:
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">
                    {subscriptionStatus?.lastPayment?.amount &&
                    subscriptionStatus?.lastPayment?.date
                      ? `KES ${
                          subscriptionStatus?.lastPayment?.amount
                        } on ${new Date(
                          subscriptionStatus?.lastPayment?.date
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}`
                      : "No payment history"}
                  </span>
                </div>
              </div>
              {/* <button
              onClick={() => setRenewDialogOpen(true)}
              className="mt-4 w-full inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-1.5 text-sm font-medium transition-colors duration-200"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Renew'}
            </button> */}
            </div>
          )}
        </div>
      )}

      {/* Plan Selection Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 p-6 h-full w-full mx-0 md:mx-0">
            <ModalHeader
              title={"Choose a Plan"}
              onClose={() => setIsPlanModalOpen(false)}
            />
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={clsx(
                    "p-5 bg-gradient-to-b from-primary/10 to-white dark:from-neutral-800 dark:to-neutral-700 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300",
                    subscriptionStatus.subscription.planName === plan.name &&
                      "scale-105"
                  )}
                >
                  <div className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
                        {plan.name} Plan
                      </h3>
                      {subscriptionStatus.subscription.planName ===
                        plan.name && (
                        <Star className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-400 mb-3">
                      {plan.description}
                    </p>
                    <div className="flex justify-center mb-3">
                      <div className="inline-flex items-center bg-neutral-200 dark:bg-neutral-600 rounded-full p-1">
                        <button
                          className={clsx(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium",
                            billingFrequencies[plan.name]
                              ? "bg-primary text-white"
                              : "text-neutral-800 dark:text-neutral-100"
                          )}
                          onClick={() =>
                            setBillingFrequencies((prev) => ({
                              ...prev,
                              [plan.name]: true,
                            }))
                          }
                        >
                          Monthly
                        </button>
                        <button
                          className={clsx(
                            "px-2.5 py-0.5 rounded-full text-xs font-medium",
                            !billingFrequencies[plan.name]
                              ? "bg-primary text-white"
                              : "text-neutral-800 dark:text-neutral-100"
                          )}
                          onClick={() =>
                            setBillingFrequencies((prev) => ({
                              ...prev,
                              [plan.name]: false,
                            }))
                          }
                        >
                          3 Months
                        </button>
                      </div>
                    </div>
                    <p className="font-bold text-neutral-800 dark:text-neutral-100">
                      Ksh{" "}
                      {billingFrequencies[plan.name]
                        ? plan.monthlyPrice
                        : plan.quarterlyPrice}{" "}
                      <span className="text-xs font-normal">
                        {billingFrequencies[plan.name]
                          ? "/ month"
                          : "/ 3 months"}
                      </span>
                    </p>
                    {!billingFrequencies[plan.name] && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
                        <span className="line-through text-red-600 dark:text-red-400">
                          Ksh {plan.monthlyPrice * 3}
                        </span>{" "}
                        <span className="font-semibold">
                          Save Ksh {plan.monthlyPrice * 3 - plan.quarterlyPrice}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-600">
                    <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 mb-2 text-left">
                      Optional Setup
                    </h4>
                    <p className="text-xs text-neutral-800 dark:text-neutral-400 text-left">
                      We add products for you + 3 months upfront subscription
                      for <strong>Ksh {plan.setupFee}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCalculateCost(plan)}
                    className={clsx(
                      "my-3 w-full inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                      (subscriptionStatus.subscription.planName === plan.name ||
                        (!isTrial && currentPlanTier >= plan.tier)) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                    disabled={
                      loading ||
                      subscriptionStatus.subscription.planName === plan.name ||
                      (!isTrial && currentPlanTier >= plan.tier)
                    }
                  >
                    {loading && selectedPlan?.name === plan.name
                      ? "Loading..."
                      : "Upgrade"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing History / Invoices */}
      <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 md:dark:bg-neutral-800 md:m-2">
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center gap-2">
          Billing History
        </h3>
        {invoices.length > 0 ? (
          <ReusableTable data={invoices} columns={columns} />
        ) : (
          <PageEmptyState icon={Package} description="No billing history." />
        )}
      </div>

      {/* Upgrade/Switch Dialog */}
      {selectedPlan && (
        <ConfirmDialog
          title={
            isTrial
              ? `Start ${selectedPlan.name} Plan`
              : `${
                  currentPlanTier < selectedPlan.tier ? "Upgrade" : "Switch"
                } to ${selectedPlan.name} Plan`
          }
          message={
            <div className="flex items-start gap-3 p-2 rounded-md bg-neutral-50 dark:bg-neutral-800">
              <Info className="w-5 h-5 text-neutral-500 dark:text-neutral-300 mt-1" />
              <div className="space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                <p className="text-neutral-600 dark:text-neutral-400">
                  This will immediately{" "}
                  {isTrial
                    ? "start your subscription"
                    : "update your subscription and billing"}
                  .
                </p>
                {proratedCost !== null ? (
                  <p className="text-neutral-800 dark:text-neutral-300">
                    Cost to{" "}
                    {isTrial
                      ? "start"
                      : currentPlanTier < selectedPlan.tier
                      ? "upgrade"
                      : "switch"}
                    : <span className="font-semibold">Ksh {proratedCost}</span>
                  </p>
                ) : (
                  <p className="text-neutral-500 dark:text-neutral-400 italic">
                    Calculating cost…
                  </p>
                )}
                <div className="mt-2">
                  <label
                    htmlFor="phoneNumber"
                    className="text-neutral-600 dark:text-neutral-400 text-sm"
                  >
                    Phone Number (M-PESA)
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="mt-1 w-full px-3 py-1.5 text-sm text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          }
          confirmLabel={
            isTrial
              ? "Start Payment"
              : currentPlanTier < selectedPlan.tier
              ? "Upgrade"
              : "Switch"
          }
          cancelLabel="Cancel"
          destructive
          onConfirm={isTrial ? handleCreatePlan : handleSwitchPlan}
          onCancel={() => {
            setSelectedPlan(null);
            setProratedCost(null);
            setPhoneNumber(backoffice_user_profile?.phone || "");
          }}
        />
      )}

      {/* Renewal Dialog */}
      {isRenewDialogOpen && (
        <ConfirmDialog
          title="Renew Subscription"
          message={
            <div className="flex items-start gap-3 p-2 rounded-md bg-neutral-50 dark:bg-neutral-800">
              <Info className="w-5 h-5 text-neutral-500 dark:text-neutral-300 mt-1" />
              <div className="space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                <p className="text-neutral-600 dark:text-neutral-400">
                  This will renew your subscription, extending it from{" "}
                  {subscriptionStatus.subscription.billingCycleEnd
                    ? new Date(
                        subscriptionStatus.subscription.billingCycleEnd
                      ).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "N/A"}
                  .
                </p>
                <p className="text-neutral-800 dark:text-neutral-300">
                  Renewal cost:{" "}
                  <span className="font-semibold">
                    KES {subscriptionStatus.nextPayment.amount || "N/A"}
                  </span>
                </p>
                <div className="mt-2">
                  <label
                    htmlFor="phoneNumber"
                    className="text-neutral-600 dark:text-neutral-400 text-sm"
                  >
                    Phone Number (M-PESA)
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="mt-1 w-full px-3 py-1.5 text-sm text-neutral-800 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          }
          confirmLabel="Initiate Payment"
          cancelLabel="Cancel"
          destructive
          onConfirm={handleInitiateSTKPush}
          onCancel={() => {
            setRenewDialogOpen(false);
            setPhoneNumber(backoffice_user_profile?.phone || "");
          }}
        />
      )}
    </div>
  );
}
