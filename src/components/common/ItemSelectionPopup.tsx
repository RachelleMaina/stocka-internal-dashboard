"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Minus, X } from "lucide-react";
import { Product, Variant, Modifier } from "@/lib/mockProducts";
import { useCart } from "@/lib/context/CartContext";

interface ItemSelectionPopupProps {
  product: Product;
  onClose: () => void;
}

interface VariantQuantity {
  variant: Variant;
  quantity: number;
}

export default function ItemSelectionPopup({ product, onClose }: ItemSelectionPopupProps) {
  const { cart, addToCart } = useCart();

  // Initialize variant quantities from cart
  const initialVariantQuantities = product.variants?.map((v) => {
    const cartItems = cart.filter(
      (item) => item.id === product.id && item.variantId === v.id
    );
    const quantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return { variant: v, quantity };
  }) || [];

  // Initialize modifiers from cart
  const initialModifiers = cart
    .filter((item) => item.id === product.id && item.modifiers)
    .flatMap((item) => item.modifiers || [])
    .reduce((acc, mod) => {
      const exists = acc.find((m) => m.id === mod.id);
      if (!exists) {
        return [...acc, { ...mod, nested: mod.nested || [] }];
      }
      return acc.map((m) =>
        m.id === mod.id
          ? {
              ...m,
              nested: [...(m.nested || []), ...(mod.nested || [])].filter(
                (n, index, self) =>
                  index === self.findIndex((x) => x.id === n.id)
              ),
            }
          : m
      );
    }, [] as { id: number; name: string; price: number; nested?: { id: number; name: string; price: number }[] }[]);

  // Initialize quantity for non-variant products
  const initialQuantity = product.variants
    ? 0
    : cart
        .filter((item) => item.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0) || 1;

  const [variantQuantities, setVariantQuantities] = useState<VariantQuantity[]>(initialVariantQuantities);
  const [selectedModifiers, setSelectedModifiers] = useState<
    { id: number; name: string; price: number; nested?: { id: number; name: string; price: number }[] }[]
  >(initialModifiers);
  const [modifierQuantity, setModifierQuantity] = useState(initialQuantity);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset error when modifiers or quantities change
    setError(null);
  }, [variantQuantities, selectedModifiers, modifierQuantity]);

  const handleVariantQuantityChange = (variantId: number, delta: number) => {
    setVariantQuantities((prev) =>
      prev.map((vq) =>
        vq.variant.id === variantId
          ? { ...vq, quantity: Math.max(0, vq.quantity + delta) }
          : vq
      )
    );
  };

  const toggleModifier = (modifier: Modifier, nested?: Modifier) => {
    setSelectedModifiers((prev) => {
      if (nested) {
        const parent = prev.find((m) => m.id === modifier.id);
        if (parent) {
          const nestedExists = parent.nested?.find((n) => n.id === nested.id);
          if (nestedExists) {
            return prev.map((m) =>
              m.id === modifier.id
                ? {
                    ...m,
                    nested: m.nested?.filter((n) => n.id !== nested.id) || [],
                  }
                : m
            );
          }
          return prev.map((m) =>
            m.id === modifier.id
              ? {
                  ...m,
                  nested: [
                    ...(m.nested || []),
                    { id: nested.id, name: nested.name, price: nested.price },
                  ],
                }
              : m
          );
        }
        return [
          ...prev,
          {
            id: modifier.id,
            name: modifier.name,
            price: modifier.price,
            nested: [{ id: nested.id, name: nested.name, price: nested.price }],
          },
        ];
      }

      const exists = prev.find((m) => m.id === modifier.id);
      if (exists) {
        return prev.filter((m) => m.id !== modifier.id);
      }
      return [
        ...prev,
        {
          id: modifier.id,
          name: modifier.name,
          price: modifier.price,
          nested: [],
        },
      ];
    });
  };

  const validateModifiers = () => {
    if (!product.modifiers) return true;
    for (const mod of product.modifiers) {
      const selected = selectedModifiers.filter((m) => m.id === mod.id);
      const count = selected.length;
      if (mod.required && count === 0) {
        setError(`Please select ${mod.name}`);
        return false;
      }
      if (mod.min && count < mod.min) {
        setError(`Select at least ${mod.min} ${mod.name}`);
        return false;
      }
      if (mod.max && count > mod.max) {
        setError(`Select at most ${mod.max} ${mod.name}`);
        return false;
      }
      if (mod.nested && mod.nested.some((n) => n.required)) {
        for (const sel of selected) {
          if (!sel.nested || sel.nested.length === 0) {
            setError(`Select a nested option for ${mod.name}`);
            return false;
          }
        }
      }
    }
    setError(null);
    return true;
  };

  const handleAddToOrder = () => {
    if (product.variants) {
      variantQuantities.forEach((vq) => {
        if (vq.quantity > 0) {
          addToCart({
            id: product.id,
            name: product.name,
            price: vq.variant.price,
            variantId: vq.variant.id,
            variantName: vq.variant.name,
            quantity: vq.quantity,
          });
        }
      });
      onClose();
    } else if (product.modifiers) {
      if (!validateModifiers()) return;
      if (modifierQuantity > 0) {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price + selectedModifiers.reduce((sum, m) => sum + m.price + (m.nested?.reduce((s, n) => s + n.price, 0) || 0), 0),
          modifiers: selectedModifiers,
          quantity: modifierQuantity,
        });
        onClose();
      }
    } else {
      if (modifierQuantity > 0) {
        addToCart({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: modifierQuantity,
        });
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div
        className="bg-white w-full h-[75vh] rounded-t-xl p-6 animate-slide-up overflow-y-auto"
        style={{ animation: "slide-up 0.3s ease-out" }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-2 bg-neutral-100 rounded-full"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-6">
          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Select Variants:</h3>
              {variantQuantities.map((vq) => (
                <div key={vq.variant.id} className="flex justify-between items-center mb-2">
                  <span className="text-neutral-600">
                    {vq.variant.name} (Ksh. {vq.variant.price.toFixed(0)})
                  </span>
                  <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-full">
                    <button
                      onClick={() => handleVariantQuantityChange(vq.variant.id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white rounded-full"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-neutral-700 text-sm">
                      {vq.quantity}
                    </span>
                    <button
                      onClick={() => handleVariantQuantityChange(vq.variant.id, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-primary rounded-full"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {product.modifiers && product.modifiers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Select Modifiers</h3>
              {product.modifiers.map((modifier) => (
                <div key={modifier.id} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-neutral-600">
                      {modifier.name} (Ksh. {modifier.price.toFixed(0)})
                      {modifier.required && <span className="text-red-500">*</span>}
                    </span>
                    <button
                      onClick={() => toggleModifier(modifier)}
                      className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 border ${
                        selectedModifiers.some((m) => m.id === modifier.id)
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
                      }`}
                    >
                      {selectedModifiers.some((m) => m.id === modifier.id) && (
                        <Check className="w-4 h-4" />
                      )}
                      {modifier.name}
                    </button>
                  </div>
                  {modifier.nested && (
                    <div className="ml-4 mt-2">
                      {modifier.nested.map((nested) => (
                        <div key={nested.id} className="flex justify-between items-center mb-1">
                          <span className="text-neutral-600">
                            {nested.name} (Ksh. {nested.price.toFixed(0)})
                            {nested.required && <span className="text-red-500">*</span>}
                          </span>
                          <button
                            onClick={() => toggleModifier(modifier, nested)}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 border ${
                              selectedModifiers
                                .find((m) => m.id === modifier.id)
                                ?.nested?.some((n) => n.id === nested.id)
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200"
                            }`}
                          >
                            {selectedModifiers
                              .find((m) => m.id === modifier.id)
                              ?.nested?.some((n) => n.id === nested.id) && (
                              <Check className="w-4 h-4" />
                            )}
                            {nested.name}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-4 flex justify-end">
                <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-full w-fit">
                  <button
                    onClick={() => setModifierQuantity(Math.max(1, modifierQuantity - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white rounded-full"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-neutral-700 text-sm">
                    {modifierQuantity}
                  </span>
                  <button
                    onClick={() => setModifierQuantity(modifierQuantity + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-primary rounded-full"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          {!product.variants && !product.modifiers && (
            <div className="flex justify-end">
              <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-full w-fit">
                <button
                  onClick={() => setModifierQuantity(Math.max(1, modifierQuantity - 1))}
                  className="w-7 h-7 flex items-center justify-center bg-white rounded-full"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-neutral-700 text-sm">
                  {modifierQuantity}
                </span>
                <button
                  onClick={() => setModifierQuantity(modifierQuantity + 1)}
                  className="w-7 h-7 flex items-center justify-center bg-primary rounded-full"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleAddToOrder}
            className="w-full py-3 bg-primary rounded-full font-medium hover:bg-opacity-90 transition-colors"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}