
"use client";

import { useCart } from "@/lib/context/CartContext";
import { useRouter } from "next/navigation";
import SaleItemCard from "@/components/common/SaleItemCard";
import { ArrowLeft } from "lucide-react";

export default function Cart() {
  const { cart} = useCart();
  const router = useRouter();

    // Calculate summary
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = 0; // Mock, adjust as needed
    const tax = subtotal * 0.1; // Mock 10% tax
  const total = subtotal - discount + tax;
  


  return (
    <main className="">
       {/* <div className="flex items-center gap-2 sticky top-0 z-10 bg-neutral-100 py-4">
          <button
            onClick={() => router.push("/pos")}
            className="rounded-full bg-white p-2 flex items-center transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <p className="font-bold text-xl">Sale Items</p>
        </div> */}
      {cart.length === 0 ? (
        <p className="text-center text-neutral-500">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <SaleItemCard key={`${item.id}-${item.variantId || item.modifiers?.map(m => m.id).join()}`} item={item} />
          ))}
            {/* Fixed Summary Card */}
            <div className="bg-white rounded-xl p-4 my-3">
        <div className="max-w-md mx-auto">
          <h3 className="font-bold mb-3">
            Order Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Ksh. {parseFloat(subtotal.toFixed(0)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>Ksh.{parseFloat(discount.toFixed(0)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>Ksh. {parseFloat(tax.toFixed(0)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold  border-t border-neutral-300 pt-4 mt-4 ">
              <span>Total</span>
              <span>Ksh.  {parseFloat(total.toFixed(0)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
          <button
            onClick={() => router.push("/charge")}
            className="w-full py-3 bg-primary rounded-full font-medium hover:bg-opacity-90 transition-colors mt-4"
          >
            Proceed to Payment
          </button>
        </div>
      )}
    </main>
  );
}