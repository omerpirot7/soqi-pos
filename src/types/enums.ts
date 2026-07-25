export const Role = {
  ADMIN: "ADMIN",
  CASHIER: "CASHIER",
  WAREHOUSE: "WAREHOUSE",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const PaymentMethod = {
  CASH: "CASH",
  CARD: "CARD",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const StockLogType = {
  SALE: "SALE",
  PURCHASE: "PURCHASE",
  ADJUSTMENT: "ADJUSTMENT",
  INTAKE: "INTAKE",
} as const;

export type StockLogType = (typeof StockLogType)[keyof typeof StockLogType];

export const AdjustmentReason = {
  DAMAGED: "DAMAGED",
  EXPIRED: "EXPIRED",
  LOST: "LOST",
  OTHER: "OTHER",
} as const;

export type AdjustmentReason = (typeof AdjustmentReason)[keyof typeof AdjustmentReason];
