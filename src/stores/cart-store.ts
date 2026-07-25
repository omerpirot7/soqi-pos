"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  nameCkb?: string | null;
  barcode?: string | null;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
  stock: number;
  imageUrl?: string | null;
};

type CartState = {
  items: CartItem[];
  discount: number;
  paymentMethod: "CASH" | "CARD";
  amountPaid: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: "CASH" | "CARD") => void;
  setAmountPaid: (amount: number) => void;
  clear: () => void;
  loadItems: (items: CartItem[], discount?: number) => void;
  subtotal: () => number;
  total: () => number;
  change: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      paymentMethod: "CASH",
      amountPaid: 0,
      addItem: (item) => {
        const qty = item.quantity ?? 1;
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(qty, item.stock) }],
          };
        });
      },
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),
      increment: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) get().setQuantity(productId, item.quantity + 1);
      },
      decrement: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) get().setQuantity(productId, item.quantity - 1);
      },
      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
      setAmountPaid: (amountPaid) => set({ amountPaid: Math.max(0, amountPaid) }),
      clear: () => set({ items: [], discount: 0, amountPaid: 0, paymentMethod: "CASH" }),
      loadItems: (items, discount = 0) => set({ items, discount, amountPaid: 0 }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
      total: () => Math.max(0, get().subtotal() - get().discount),
      change: () => Math.max(0, get().amountPaid - get().total()),
    }),
    { name: "pos-cart" }
  )
);
