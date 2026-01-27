"use client";

import { useCart } from "@/lib/context/CartContext";
import { Plus, Minus, Trash2 } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: number;
  variantName?: string;
  modifiers?: { id: number; name: string; price: number; nested?: { id: number; name: string; price: number }[] }[];
}

interface SaleItemCardProps {
  item: CartItem;
}

export default function SaleItemCard({ item }: SaleItemCardProps) {
  const { decreaseQuantity, addToCart, removeFromCart } = useCart();

  // Generate placeholder initials
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    const first = words[0]?.[0] || "";
    const second = words[1]?.[0] || "";
    return `${first}${second}`.toUpperCase();
  };

  // Calculate total price including modifiers
  const totalPrice =
    item.price +
    (item.modifiers?.reduce(
      (sum, mod) =>
        sum + mod.price + (mod.nested?.reduce((s, n) => s + n.price, 0) || 0),
      0
    ) || 0);

  return (
    <div className="p-3 flex gap-1 bg-white rounded-xl">
      {/* <div className="display-none md:display-block">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            className="w-12 h-12 object-cover rounded-xl"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center text-neutral-400 bg-neutral-100 rounded-xl text-lg font-bold">
            {getInitials(item.name)}
          </div>
        )}
      </div> */}
      <div className="w-full flex flex-col p-2">
        {/* Product Name and Total Price */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold line-clamp-1">
            x{item.quantity} {item.variantName ? `${item.name} ${item.variantName}` : item.name}
          </h3>
          <p className="font-bold">
            Ksh. {(totalPrice * item.quantity).toLocaleString()}
          </p>
        </div>
        {/* Variants/Modifiers */}
        <div className="text-sm text-neutral-500 mb-2">
          {item.variantName ? (
            <div className="flex justify-between">
             
              {/* <p>
                x{item.quantity}, {item.variantName}
              </p>
              <p>Ksh. {item.price.toFixed(0)}</p> */}
            </div>
          ) : item.modifiers && item.modifiers.length > 0 ? (
            item.modifiers.map((mod) => (
              <div key={mod.id}>
                <div className="flex justify-between">
                  <p>
                    x{item.quantity}, {mod.name}
                  </p>
                  <p>Ksh. {mod.price.toFixed(0)}</p>
                </div>
                {mod.nested &&
                  mod.nested.map((nested) => (
                    <div key={nested.id} className="flex justify-between ml-4">
                      <p>
                        x{item.quantity}, {nested.name}
                      </p>
                      <p>Ksh. {nested.price.toFixed(0)}</p>
                    </div>
                  ))}
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <p>x{item.quantity}, Standard</p>
              <p>Ksh. {item.price.toFixed(0)}</p>
            </div>
          )}
        </div>
        {/* Buttons */}
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={() =>
              removeFromCart(
                item.id,
                item.variantId,
                item.modifiers
              )
            }
            className="text-red-500 hover:text-red-400 flex items-center gap-1"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="w-4 h-4" /> Remove
          </button>
          <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-full font-semibold">
            <button
              onClick={() =>
                decreaseQuantity(
                  item.id,
                  item.variantId,
                  item.modifiers
                )
              }
              className="w-7 h-7 flex items-center justify-center bg-white rounded-full"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-4 text-center text-neutral-700 text-sm">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                addToCart({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: 1,
                  variantId: item.variantId,
                  variantName: item.variantName,
                  modifiers: item.modifiers,
                })
              }
              className="w-7 h-7 flex items-center justify-center bg-primary rounded-full"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}