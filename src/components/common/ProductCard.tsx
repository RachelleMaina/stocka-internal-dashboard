"use client";

import { useCart } from "@/lib/context/CartContext";
import { Plus, Minus, Trash2 } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

interface ProductCardProps {
  product: Product;
  removeFromCart?: (id:number) => void;
}

export default function ProductCard({ product, removeFromCart }: ProductCardProps) {
  const { cart, addToCart, decreaseQuantity } = useCart();
  const cartItem = cart.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Generate placeholder initials
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    const first = words[0]?.[0] || "";
    const second = words[1]?.[0] || "";
    return `${first}${second}`.toUpperCase();
  };

  return (
    <div className="p-2 flex gap-5 bg-white rounded-xl">
    <div>
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image}
          alt={product.name}
          className="w-16 h-16 object-cover rounded-xl"
        />
      ) : (
        <div
          className="w-16 h-16 flex items-center justify-center text-neutral-400 bg-neutral-100 rounded-xl   text-xl font-bold"
        >
          {getInitials(product.name)}
        </div>
        )}
        </div>
      <div className="w-full flex flex-col">
<div className="w-full flex justify-between items-start">
      <h3 className="font-semibold mb-1 text-neutral-600">
        {product.name}
        </h3>
        {removeFromCart && ( <button
                      onClick={() => removeFromCart(product.id)}
                      className="hover:text-red-400 text-red-500"
                      aria-label={`Remove ${product.name} from cart`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>)}
                   
      </div>
      
    
      <div className="flex items-center justify-between">
        <p className="font-bold">
          Ksh. {parseFloat(product.price.toFixed(0)).toLocaleString()}
      </p>

        <div className="flex items-center gap-2 p-1 bg-neutral-100  rounded-full font-semibold">
          <button
            onClick={() => decreaseQuantity(product.id)}
            disabled={quantity === 0}
            className="w-6 h-6 flex items-center justify-center  bg-white rounded-full"
            aria-label={`Decrease quantity of ${product.name}`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-4 text-center text-neutral-700 text-sm">
            {quantity}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="w-6 h-6 flex items-center justify-center bg-primary rounded-full"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      </div>
      </div>
  );
}