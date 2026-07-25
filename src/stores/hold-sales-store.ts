"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./cart-store";

export type HeldSale = {
  id: string;
  label: string;
  items: CartItem[];
  discount: number;
  createdAt: string;
};

type HoldState = {
  held: HeldSale[];
  hold: (items: CartItem[], discount: number, label?: string) => void;
  resume: (id: string) => HeldSale | undefined;
  remove: (id: string) => void;
};

export const useHoldSalesStore = create<HoldState>()(
  persist(
    (set, get) => ({
      held: [],
      hold: (items, discount, label) => {
        if (!items.length) return;
        const sale: HeldSale = {
          id: crypto.randomUUID(),
          label: label || `Hold ${get().held.length + 1}`,
          items,
          discount,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ held: [sale, ...s.held] }));
      },
      resume: (id) => {
        const sale = get().held.find((h) => h.id === id);
        if (sale) set((s) => ({ held: s.held.filter((h) => h.id !== id) }));
        return sale;
      },
      remove: (id) => set((s) => ({ held: s.held.filter((h) => h.id !== id) })),
    }),
    { name: "pos-held-sales" }
  )
);
