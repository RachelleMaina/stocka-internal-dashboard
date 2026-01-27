"use client";

import { CartItem } from "@/types/item";
import { createContext, ReactNode, useContext, useState } from "react";

interface CartContextType {
  cart: CartItem[];
  clearCart: () => void;
  addToCart: (product: CartItem) => void;
  adjustQuantity: (id: string, amount: number) => void;
  addQuantity: (id: string, amount: number) => void;
  updateQuantity: (id: string, amount: number) => void;
  removeFromCart: (id: string) => void;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [mode, setMode] = useState([]);
 const [editingCartItem, setEditingCartItem] = useState(null);
  const [addingItem, setAddingItem] = useState(null);
  
  const clearTable = () => setSelectedTable(null);

  const clearCart = () => setCart([]);

  const addToCart = (product: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.item_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.item_id === product.id
            ? {
                ...item,
                quantity: item.quantity + (product.quantity || 1),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: product.quantity || 1,
        },
      ];
    });
  };
  // const addToCart = (product: CartItem) => {
  //   setCart((prev) => {
  //     const existing = prev.find(
  //       (item) =>
  //         item.item_id === product.id &&
  //         item.variantId === product.variantId &&
  //         JSON.stringify(item.modifiers) === JSON.stringify(product.modifiers)
  //     );
  //     if (existing) {
  //       return prev.map((item) =>
  //         item.item_id === product.id &&
  //         item.variantId === product.variantId &&
  //         JSON.stringify(item.modifiers) === JSON.stringify(product.modifiers)
  //           ? {
  //               ...item,
  //               quantity: item.quantity + (product.quantity || 1),
  //             }
  //           : item
  //       );
  //     }
  //     return [
  //       ...prev,
  //       {
  //         ...product,
  //         quantity: product.quantity || 1,
  //         variantId: product.variantId,
  //         variantName: product.variantName,
  //         modifiers: product.modifiers,
  //       },
  //     ];
  //   });
  // };

  const addQuantity = (id: string, value: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.item_id === id ? { ...item, quantity: value } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const adjustQuantity = (id: string, amount: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.item_id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateQuantity = (id: string, amount: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.item_id === id ? { ...item, quantity: amount } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  function updatePrice(itemId: string, price: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const baseItem = items.find((i) => i.id === item.item_id);
          const sellingPrice = baseItem?.selling_price || 1; // Fallback to 1 to avoid division by zero
          const newQuantity = item.is_sold_by_value
            ? Math.max(
                1,
                parseFloat(
                  (
                    (isNaN(price) || price <= 0 ? 0 : price) / sellingPrice
                  ).toFixed(2)
                )
              )
            : item.quantity;
          return {
            ...item,
            unit_price: isNaN(price) || price < 0 ? 0 : price,
            quantity: newQuantity,
          };
        }
        return item;
      })
    );
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => !(item.item_id === id)));
  };

  const getTotalItems = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );
    const discount = 0;
    const total = subtotal - discount;
    return total;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        clearCart,
        addToCart,
        addQuantity,
        updateQuantity,
        updatePrice,
        adjustQuantity,
        removeFromCart,
        getTotalItems,
        selectedBill,
        selectedTable,
        setSelectedTable,
        setSelectedBill,
        clearTable,
        isCartModalOpen,
        setIsCartModalOpen,
        menuItems,
        setMenuItems,
        mode,
        setMode,
           editingCartItem,
          setEditingCartItem,
          addingItem,
          setAddingItem
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
