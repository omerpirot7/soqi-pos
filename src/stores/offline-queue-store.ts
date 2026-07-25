"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type QueuedSale = {
  id: string;
  payload: {
    items: { productId: string; quantity: number; unitPrice: number; costPrice: number }[];
    discount: number;
    paymentMethod: "CASH" | "CARD";
    amountPaid?: number;
  };
  createdAt: string;
};

type OfflineState = {
  queue: QueuedSale[];
  enqueue: (payload: QueuedSale["payload"]) => void;
  dequeue: (id: string) => void;
  clear: () => void;
};

export const useOfflineQueueStore = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (payload) =>
        set((s) => ({
          queue: [
            ...s.queue,
            { id: crypto.randomUUID(), payload, createdAt: new Date().toISOString() },
          ],
        })),
      dequeue: (id) => set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
      clear: () => set({ queue: [] }),
    }),
    { name: "pos-offline-queue" }
  )
);
