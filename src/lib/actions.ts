"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, requireSession } from "@/lib/auth";
import { Role, PaymentMethod, StockLogType, AdjustmentReason } from "@/types/enums";
import { generateReceiptNo } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getDashboardData(range: "daily" | "weekly" | "monthly" = "daily") {
  await requireRole(Role.ADMIN);

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const days = range === "daily" ? 7 : range === "weekly" ? 28 : 90;
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const [today, periodSales, topRows, lowStockCandidates] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfToday } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true, total: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { createdAt: { gte: start } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameCkb: true,
        stock: true,
        minStock: true,
        unit: true,
      },
      orderBy: { stock: "asc" },
      take: 80,
    }),
  ]);

  const todayTotal = today._sum.total ?? 0;
  const todayCount = today._count._all;
  const lowStock = lowStockCandidates
    .filter((p) => p.stock <= p.minStock)
    .slice(0, 8);

  const trendMap = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key =
      range === "monthly"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : range === "weekly"
          ? `W${Math.ceil((i + 1) / 7)}`
          : d.toISOString().slice(0, 10);
    if (!trendMap.has(key)) trendMap.set(key, 0);
  }

  for (const sale of periodSales) {
    const d = sale.createdAt;
    let key: string;
    if (range === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (range === "weekly") {
      const dayIndex = Math.floor((d.getTime() - start.getTime()) / (86400000));
      key = `W${Math.max(1, Math.ceil((dayIndex + 1) / 7))}`;
    } else {
      key = d.toISOString().slice(0, 10);
    }
    trendMap.set(key, (trendMap.get(key) || 0) + sale.total);
  }

  const topNames = topRows.length
    ? await prisma.product.findMany({
        where: { id: { in: topRows.map((r) => r.productId) } },
        select: { id: true, name: true, nameCkb: true },
      })
    : [];
  const nameById = new Map(topNames.map((p) => [p.id, p]));

  const topProducts = topRows.map((r) => ({
    name: nameById.get(r.productId)?.name ?? "",
    nameCkb: nameById.get(r.productId)?.nameCkb ?? null,
    qty: r._sum.quantity ?? 0,
    revenue: r._sum.lineTotal ?? 0,
  }));

  return {
    todayTotal,
    todayCount,
    trend: Array.from(trendMap.entries()).map(([label, total]) => ({ label, total })),
    topProducts,
    lowStock,
  };
}

const saleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        costPrice: z.number().nonnegative(),
      })
    )
    .min(1),
  discount: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["CASH", "CARD"]),
  amountPaid: z.number().nonnegative().optional(),
});

export async function completeSale(input: z.infer<typeof saleSchema>) {
  const session = await requireRole(Role.ADMIN, Role.CASHIER);
  const data = saleSchema.parse(input);
  const discount = data.discount ?? 0;

  const products = await prisma.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of data.items) {
    const product = productMap.get(item.productId);
    if (!product || !product.isActive) throw new Error("PRODUCT_NOT_FOUND");
    if (product.stock < item.quantity) throw new Error("INSUFFICIENT_STOCK");
  }

  const subtotal = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const amountPaid = data.paymentMethod === PaymentMethod.CASH ? data.amountPaid ?? total : total;
  const change = data.paymentMethod === PaymentMethod.CASH ? Math.max(0, amountPaid - total) : 0;

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        receiptNo: generateReceiptNo(),
        cashierId: session.user.id,
        subtotal,
        discount,
        total,
        paymentMethod: data.paymentMethod,
        amountPaid,
        change,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            costPrice: i.costPrice,
            lineTotal: i.unitPrice * i.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        cashier: true,
      },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      await tx.stockLog.create({
        data: {
          productId: item.productId,
          userId: session.user.id,
          type: StockLogType.SALE,
          quantity: -item.quantity,
          unitCost: item.costPrice,
        },
      });
    }

    return created;
  });

  revalidatePath("/");
  revalidatePath("/pos");
  revalidatePath("/sales");
  revalidatePath("/inventory");

  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });

  return { sale, settings };
}

export async function getPosCatalog() {
  await requireRole(Role.ADMIN, Role.CASHIER);
  const [categories, products, settings] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.storeSettings.findUnique({ where: { id: "default" } }),
  ]);
  return { categories, products, settings };
}

export async function findProductByBarcode(code: string) {
  await requireRole(Role.ADMIN, Role.CASHIER);
  return prisma.product.findFirst({
    where: {
      isActive: true,
      OR: [{ barcode: code }, { sku: code }],
    },
  });
}

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  nameCkb: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  supplierId: z.string().optional().nullable(),
  costPrice: z.number().nonnegative(),
  sellPrice: z.number().nonnegative(),
  unit: z.string().optional(),
  stock: z.number().nonnegative().optional(),
  minStock: z.number().nonnegative().optional(),
  imageUrl: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function upsertProduct(input: z.infer<typeof productSchema>) {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  const data = productSchema.parse(input);
  const payload = {
    name: data.name,
    nameCkb: data.nameCkb || null,
    barcode: data.barcode || null,
    sku: data.sku || null,
    categoryId: data.categoryId,
    supplierId: data.supplierId || null,
    costPrice: data.costPrice,
    sellPrice: data.sellPrice,
    unit: data.unit ?? "piece",
    stock: data.stock ?? 0,
    minStock: data.minStock ?? 5,
    imageUrl: data.imageUrl || null,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    isActive: data.isActive ?? true,
  };

  if (data.id) {
    await prisma.product.update({ where: { id: data.id }, data: payload });
  } else {
    await prisma.product.create({ data: payload });
  }
  revalidatePath("/inventory");
  revalidatePath("/pos");
  return { success: true };
}

export async function deleteProduct(id: string) {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  await prisma.product.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/inventory");
  return { success: true };
}

export async function stockIntake(
  items: { productId: string; quantity: number; unitCost?: number; supplierId?: string }[]
) {
  const session = await requireRole(Role.ADMIN, Role.WAREHOUSE);
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (item.quantity <= 0) continue;
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          ...(item.unitCost != null ? { costPrice: item.unitCost } : {}),
        },
      });
      await tx.stockLog.create({
        data: {
          productId: item.productId,
          userId: session.user.id,
          supplierId: item.supplierId || null,
          type: StockLogType.INTAKE,
          quantity: item.quantity,
          unitCost: item.unitCost,
        },
      });
    }
  });
  revalidatePath("/inventory");
  return { success: true };
}

export async function stockAdjust(input: {
  productId: string;
  quantity: number;
  reason: AdjustmentReason;
  note?: string;
}) {
  const session = await requireRole(Role.ADMIN, Role.WAREHOUSE);
  const qty = -Math.abs(input.quantity);
  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: input.productId },
      data: { stock: { increment: qty } },
    });
    await tx.stockLog.create({
      data: {
        productId: input.productId,
        userId: session.user.id,
        type: StockLogType.ADJUSTMENT,
        quantity: qty,
        reason: input.reason,
        note: input.note,
      },
    });
  });
  revalidatePath("/inventory");
  return { success: true };
}

export async function getInventoryData() {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  const [products, categories, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, supplier: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { products, categories, suppliers };
}

// Categories
export async function upsertCategory(input: {
  id?: string;
  name: string;
  nameCkb?: string;
  icon?: string;
  color?: string;
}) {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  if (input.id) {
    await prisma.category.update({
      where: { id: input.id },
      data: { name: input.name, nameCkb: input.nameCkb, icon: input.icon, color: input.color },
    });
  } else {
    await prisma.category.create({
      data: { name: input.name, nameCkb: input.nameCkb, icon: input.icon, color: input.color },
    });
  }
  revalidatePath("/categories");
  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  const count = await prisma.product.count({ where: { categoryId: id, isActive: true } });
  if (count > 0) throw new Error("CATEGORY_HAS_PRODUCTS");
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
  return { success: true };
}

// Suppliers
export async function upsertSupplier(input: {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}) {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  if (input.id) {
    await prisma.supplier.update({ where: { id: input.id }, data: input });
  } else {
    await prisma.supplier.create({ data: input });
  }
  revalidatePath("/suppliers");
  return { success: true };
}

export async function deleteSupplier(id: string) {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  await prisma.product.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
  return { success: true };
}

// Sales
export async function getSales(filters?: {
  from?: string;
  to?: string;
  cashierId?: string;
  paymentMethod?: string;
  ownOnly?: boolean;
}) {
  const session = await requireSession();
  const where: Record<string, unknown> = {};

  if (session.user.role === Role.CASHIER || filters?.ownOnly) {
    where.cashierId = session.user.id;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    where.createdAt = { gte: start };
  } else {
    if (filters?.cashierId) where.cashierId = filters.cashierId;
    if (filters?.from || filters?.to) {
      where.createdAt = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }
  }
  if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod;

  return prisma.sale.findMany({
    where,
    select: {
      id: true,
      receiptNo: true,
      subtotal: true,
      discount: true,
      total: true,
      paymentMethod: true,
      amountPaid: true,
      change: true,
      createdAt: true,
      cashier: { select: { id: true, name: true } },
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          costPrice: true,
          product: { select: { name: true, nameCkb: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getSaleById(id: string) {
  await requireSession();
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { cashier: true, items: { include: { product: true } } },
  });
  const settings = await prisma.storeSettings.findUnique({ where: { id: "default" } });
  return { sale, settings };
}

export async function getReportsData(from?: string, to?: string) {
  await requireRole(Role.ADMIN);
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  const [totals, cashierRows, items] = await Promise.all([
    prisma.sale.aggregate({ where, _sum: { total: true } }),
    prisma.sale.groupBy({
      by: ["cashierId"],
      where,
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.saleItem.findMany({
      where: { sale: where },
      select: { productId: true, quantity: true, lineTotal: true, costPrice: true },
    }),
  ]);

  const revenue = totals._sum.total ?? 0;
  const cost = items.reduce((s, item) => s + item.costPrice * item.quantity, 0);
  const profit = revenue - cost;

  const byProduct = new Map<string, { qty: number; revenue: number }>();
  for (const item of items) {
    const p = byProduct.get(item.productId) || { qty: 0, revenue: 0 };
    p.qty += item.quantity;
    p.revenue += item.lineTotal;
    byProduct.set(item.productId, p);
  }

  const topIds = Array.from(byProduct.entries())
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 10);

  const [products, cashiers] = await Promise.all([
    topIds.length
      ? prisma.product.findMany({
          where: { id: { in: topIds.map(([id]) => id) } },
          select: { id: true, name: true, nameCkb: true },
        })
      : [],
    cashierRows.length
      ? prisma.user.findMany({
          where: { id: { in: cashierRows.map((r) => r.cashierId) } },
          select: { id: true, name: true },
        })
      : [],
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const cashierById = new Map(cashiers.map((c) => [c.id, c.name]));

  return {
    revenue,
    cost,
    profit,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
    bestSellers: topIds.map(([id, agg]) => ({
      name: productById.get(id)?.nameCkb || productById.get(id)?.name || "",
      qty: agg.qty,
      revenue: agg.revenue,
    })),
    byCashier: cashierRows
      .map((r) => ({
        name: cashierById.get(r.cashierId) ?? "",
        count: r._count._all,
        revenue: r._sum.total ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

// Users
export async function getUsers() {
  await requireRole(Role.ADMIN);
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export async function upsertUser(input: {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  isActive?: boolean;
  locale?: string;
}) {
  await requireRole(Role.ADMIN);
  const bcrypt = await import("bcryptjs");
  const locale = input.locale === "en" ? "en" : "ckb";
  if (input.id) {
    await prisma.user.update({
      where: { id: input.id },
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        locale,
        isActive: input.isActive ?? true,
        ...(input.password
          ? { passwordHash: await bcrypt.hash(input.password, 10) }
          : {}),
      },
    });
  } else {
    if (!input.password) throw new Error("PASSWORD_REQUIRED");
    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        locale,
        passwordHash: await bcrypt.hash(input.password, 10),
        isActive: input.isActive ?? true,
      },
    });
  }
  revalidatePath("/users");
  return { success: true };
}

export async function updateMyLocale(locale: string) {
  const session = await requireSession();
  const value = locale === "en" ? "en" : "ckb";
  // After a DB reseed, an old session cookie may point at a deleted user id
  const result = await prisma.user.updateMany({
    where: { id: session.user.id },
    data: { locale: value },
  });
  return { success: result.count > 0, locale: value };
}

export async function setUserActive(id: string, isActive: boolean) {
  await requireRole(Role.ADMIN);
  await prisma.user.update({ where: { id }, data: { isActive } });
  revalidatePath("/users");
  return { success: true };
}

// Settings
export async function getSettings() {
  await requireRole(Role.ADMIN);
  return prisma.storeSettings.findUnique({ where: { id: "default" } });
}

export async function updateSettings(input: {
  storeName: string;
  address?: string;
  phone?: string;
  currency?: string;
  receiptFooter?: string;
  locale?: string;
  receiptWidthMm?: number;
  logoUrl?: string;
}) {
  await requireRole(Role.ADMIN);
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...input },
    update: input,
  });
  revalidatePath("/settings");
  revalidatePath("/");
  return { success: true };
}

export async function getProductsForLabels() {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function generateBarcodeForProduct(productId: string) {
  await requireRole(Role.ADMIN, Role.WAREHOUSE);
  const code = `628${Date.now().toString().slice(-10)}`;
  await prisma.product.update({ where: { id: productId }, data: { barcode: code } });
  revalidatePath("/labels");
  revalidatePath("/inventory");
  return { barcode: code };
}
