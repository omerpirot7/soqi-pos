import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const Role = { ADMIN: "ADMIN", CASHIER: "CASHIER", WAREHOUSE: "WAREHOUSE" } as const;
const PaymentMethod = { CASH: "CASH", CARD: "CARD" } as const;
const StockLogType = { SALE: "SALE", PURCHASE: "PURCHASE", ADJUSTMENT: "ADJUSTMENT", INTAKE: "INTAKE" } as const;

const prisma = new PrismaClient();

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSettings.deleteMany();

  const passwordHash = await bcrypt.hash("admin123", 10);
  const cashierHash = await bcrypt.hash("cashier123", 10);
  const warehouseHash = await bcrypt.hash("warehouse123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "ئەحمەد بەڕێوەبەر",
      email: "admin@store.local",
      passwordHash,
      role: Role.ADMIN,
      locale: "ckb",
    },
  });

  const cashier = await prisma.user.create({
    data: {
      name: "سارە کاشێر",
      email: "cashier@store.local",
      passwordHash: cashierHash,
      role: Role.CASHIER,
      locale: "ckb",
    },
  });

  await prisma.user.create({
    data: {
      name: "کەریم کۆگا",
      email: "warehouse@store.local",
      passwordHash: warehouseHash,
      role: Role.WAREHOUSE,
      locale: "ckb",
    },
  });

  await prisma.storeSettings.create({
    data: {
      storeName: "سۆقی بۆ خۆراک",
      address: "هەولێر، شەقامی ٦٠ مەتر",
      phone: "0750 123 4567",
      currency: "IQD",
      receiptFooter: "سوپاس بۆ سەردانەکەتان — ڕۆژێکی خۆش بۆتان دەخوازین",
      locale: "ckb",
      receiptWidthMm: 80,
    },
  });

  const categories = await Promise.all(
    [
      { name: "Grains & Rice", nameAr: "حبوب وأرز", icon: "Wheat", color: "#CA8A04" },
      { name: "Oils & Ghee", nameAr: "زيوت وسمن", icon: "Droplets", color: "#D97706" },
      { name: "Drinks", nameAr: "مشروبات", icon: "CupSoda", color: "#2563EB" },
      { name: "Snacks", nameAr: "سناكات", icon: "Cookie", color: "#EA580C" },
      { name: "Dairy", nameAr: "ألبان", icon: "Milk", color: "#7C3AED" },
      { name: "Cleaning", nameAr: "منظفات", icon: "Sparkles", color: "#0891B2" },
      { name: "Canned Food", nameAr: "معلبات", icon: "Package", color: "#DC2626" },
      { name: "Bakery", nameAr: "مخبوزات", icon: "Croissant", color: "#B45309" },
    ].map((c) => prisma.category.create({ data: c }))
  );

  const [grains, oils, drinks, snacks, dairy, cleaning, canned, bakery] = categories;

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "شركة الشمال للتجارة",
        phone: "0750 111 2222",
        email: "north@supply.iq",
        address: "أربيل",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "مؤسسة الرافدين",
        phone: "0770 333 4444",
        email: "rafidain@supply.iq",
        address: "بغداد",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "توزيعات كوردستان",
        phone: "0751 555 6666",
        address: "السليمانية",
      },
    }),
  ]);

  const [s1, s2, s3] = suppliers;

  const productData = [
    { name: "Basmati Rice 5kg", nameAr: "أرز بسمتي 5 كغ", barcode: "6281001001001", sku: "GR-001", categoryId: grains.id, supplierId: s1.id, costPrice: 4500, sellPrice: 6000, unit: "piece", stock: 40, minStock: 10 },
    { name: "Egyptian Rice 1kg", nameAr: "أرز مصري 1 كغ", barcode: "6281001001002", sku: "GR-002", categoryId: grains.id, supplierId: s1.id, costPrice: 1200, sellPrice: 1750, unit: "piece", stock: 80, minStock: 20 },
    { name: "Bulgur 1kg", nameAr: "برغل 1 كغ", barcode: "6281001001003", sku: "GR-003", categoryId: grains.id, supplierId: s2.id, costPrice: 900, sellPrice: 1300, unit: "piece", stock: 35, minStock: 10 },
    { name: "Lentils 1kg", nameAr: "عدس 1 كغ", barcode: "6281001001004", sku: "GR-004", categoryId: grains.id, supplierId: s2.id, costPrice: 1500, sellPrice: 2100, unit: "piece", stock: 28, minStock: 8 },
    { name: "Chickpeas 1kg", nameAr: "حمص 1 كغ", barcode: "6281001001005", sku: "GR-005", categoryId: grains.id, supplierId: s1.id, costPrice: 1600, sellPrice: 2200, unit: "piece", stock: 22, minStock: 8 },
    { name: "Sunflower Oil 1L", nameAr: "زيت دوار الشمس 1 لتر", barcode: "6281002002001", sku: "OL-001", categoryId: oils.id, supplierId: s1.id, costPrice: 2800, sellPrice: 3750, unit: "liter", stock: 50, minStock: 15 },
    { name: "Olive Oil 500ml", nameAr: "زيت زيتون 500 مل", barcode: "6281002002002", sku: "OL-002", categoryId: oils.id, supplierId: s3.id, costPrice: 5500, sellPrice: 7500, unit: "piece", stock: 18, minStock: 5 },
    { name: "Vegetable Ghee 1kg", nameAr: "سمن نباتي 1 كغ", barcode: "6281002002003", sku: "OL-003", categoryId: oils.id, supplierId: s2.id, costPrice: 3200, sellPrice: 4200, unit: "piece", stock: 25, minStock: 8 },
    { name: "Cola 330ml", nameAr: "كولا 330 مل", barcode: "6281003003001", sku: "DR-001", categoryId: drinks.id, supplierId: s3.id, costPrice: 350, sellPrice: 500, unit: "piece", stock: 120, minStock: 30 },
    { name: "Orange Juice 1L", nameAr: "عصير برتقال 1 لتر", barcode: "6281003003002", sku: "DR-002", categoryId: drinks.id, supplierId: s3.id, costPrice: 1500, sellPrice: 2200, unit: "liter", stock: 40, minStock: 12 },
    { name: "Mineral Water 6-pack", nameAr: "ماء معدني 6 قطع", barcode: "6281003003003", sku: "DR-003", categoryId: drinks.id, supplierId: s1.id, costPrice: 1000, sellPrice: 1500, unit: "box", stock: 60, minStock: 15 },
    { name: "Energy Drink", nameAr: "مشروب طاقة", barcode: "6281003003004", sku: "DR-004", categoryId: drinks.id, supplierId: s3.id, costPrice: 900, sellPrice: 1500, unit: "piece", stock: 45, minStock: 10 },
    { name: "Potato Chips", nameAr: "شيبس بطاطا", barcode: "6281004004001", sku: "SN-001", categoryId: snacks.id, supplierId: s3.id, costPrice: 400, sellPrice: 750, unit: "piece", stock: 90, minStock: 20 },
    { name: "Chocolate Bar", nameAr: "شوكولاتة", barcode: "6281004004002", sku: "SN-002", categoryId: snacks.id, supplierId: s2.id, costPrice: 500, sellPrice: 850, unit: "piece", stock: 70, minStock: 15 },
    { name: "Biscuits Pack", nameAr: "بسكويت علبة", barcode: "6281004004003", sku: "SN-003", categoryId: snacks.id, supplierId: s2.id, costPrice: 800, sellPrice: 1250, unit: "piece", stock: 55, minStock: 12 },
    { name: "Nuts Mix 250g", nameAr: "مكسرات مشكلة 250غ", barcode: "6281004004004", sku: "SN-004", categoryId: snacks.id, supplierId: s1.id, costPrice: 3000, sellPrice: 4500, unit: "piece", stock: 20, minStock: 5 },
    { name: "Fresh Milk 1L", nameAr: "حليب طازج 1 لتر", barcode: "6281005005001", sku: "DY-001", categoryId: dairy.id, supplierId: s2.id, costPrice: 1200, sellPrice: 1750, unit: "liter", stock: 35, minStock: 10, expiresAt: daysFromNow(7) },
    { name: "Yogurt 500g", nameAr: "لبن زبادي 500غ", barcode: "6281005005002", sku: "DY-002", categoryId: dairy.id, supplierId: s2.id, costPrice: 800, sellPrice: 1200, unit: "piece", stock: 28, minStock: 8, expiresAt: daysFromNow(5) },
    { name: "Cheese 400g", nameAr: "جبنة 400غ", barcode: "6281005005003", sku: "DY-003", categoryId: dairy.id, supplierId: s1.id, costPrice: 2500, sellPrice: 3500, unit: "piece", stock: 22, minStock: 6, expiresAt: daysFromNow(20) },
    { name: "Butter 200g", nameAr: "زبدة 200غ", barcode: "6281005005004", sku: "DY-004", categoryId: dairy.id, supplierId: s1.id, costPrice: 1800, sellPrice: 2600, unit: "piece", stock: 15, minStock: 5, expiresAt: daysFromNow(30) },
    { name: "Dish Soap 750ml", nameAr: "سائل جلي 750 مل", barcode: "6281006006001", sku: "CL-001", categoryId: cleaning.id, supplierId: s3.id, costPrice: 1500, sellPrice: 2250, unit: "piece", stock: 40, minStock: 10 },
    { name: "Laundry Detergent 3kg", nameAr: "مسحوق غسيل 3 كغ", barcode: "6281006006002", sku: "CL-002", categoryId: cleaning.id, supplierId: s3.id, costPrice: 4000, sellPrice: 5500, unit: "piece", stock: 25, minStock: 8 },
    { name: "Toilet Paper 12-pack", nameAr: "مناديل حمام 12 رول", barcode: "6281006006003", sku: "CL-003", categoryId: cleaning.id, supplierId: s1.id, costPrice: 3500, sellPrice: 5000, unit: "box", stock: 30, minStock: 8 },
    { name: "Glass Cleaner", nameAr: "منظف زجاج", barcode: "6281006006004", sku: "CL-004", categoryId: cleaning.id, supplierId: s3.id, costPrice: 1200, sellPrice: 1800, unit: "piece", stock: 18, minStock: 5 },
    { name: "Tomato Paste 400g", nameAr: "معجون طماطم 400غ", barcode: "6281007007001", sku: "CN-001", categoryId: canned.id, supplierId: s2.id, costPrice: 700, sellPrice: 1100, unit: "piece", stock: 60, minStock: 15 },
    { name: "Tuna Can", nameAr: "تونة معلبة", barcode: "6281007007002", sku: "CN-002", categoryId: canned.id, supplierId: s2.id, costPrice: 1500, sellPrice: 2200, unit: "piece", stock: 45, minStock: 12 },
    { name: "Beans Can", nameAr: "فاصوليا معلبة", barcode: "6281007007003", sku: "CN-003", categoryId: canned.id, supplierId: s1.id, costPrice: 900, sellPrice: 1400, unit: "piece", stock: 38, minStock: 10 },
    { name: "Corn Can", nameAr: "ذرة معلبة", barcode: "6281007007004", sku: "CN-004", categoryId: canned.id, supplierId: s1.id, costPrice: 850, sellPrice: 1300, unit: "piece", stock: 32, minStock: 10 },
    { name: "White Bread", nameAr: "خبز أبيض", barcode: "6281008008001", sku: "BK-001", categoryId: bakery.id, supplierId: s3.id, costPrice: 400, sellPrice: 750, unit: "piece", stock: 40, minStock: 15, expiresAt: daysFromNow(2) },
    { name: "Arabic Bread Pack", nameAr: "صمون عربي", barcode: "6281008008002", sku: "BK-002", categoryId: bakery.id, supplierId: s3.id, costPrice: 500, sellPrice: 1000, unit: "piece", stock: 50, minStock: 15, expiresAt: daysFromNow(1) },
    { name: "Croissant", nameAr: "كرواسان", barcode: "6281008008003", sku: "BK-003", categoryId: bakery.id, supplierId: s3.id, costPrice: 600, sellPrice: 1000, unit: "piece", stock: 24, minStock: 8, expiresAt: daysFromNow(2) },
    { name: "Cake Slice", nameAr: "قطعة كيك", barcode: "6281008008004", sku: "BK-004", categoryId: bakery.id, supplierId: s3.id, costPrice: 1000, sellPrice: 1750, unit: "piece", stock: 12, minStock: 5, expiresAt: daysFromNow(3) },
    // Low stock items for alerts
    { name: "Sugar 1kg", nameAr: "سكر 1 كغ", barcode: "6281001001006", sku: "GR-006", categoryId: grains.id, supplierId: s1.id, costPrice: 1000, sellPrice: 1400, unit: "piece", stock: 4, minStock: 15 },
    { name: "Tea Bags 100", nameAr: "شاي 100 كيس", barcode: "6281003003005", sku: "DR-005", categoryId: drinks.id, supplierId: s2.id, costPrice: 2500, sellPrice: 3500, unit: "piece", stock: 3, minStock: 10 },
    { name: "Salt 1kg", nameAr: "ملح 1 كغ", barcode: "6281001001007", sku: "GR-007", categoryId: grains.id, supplierId: s1.id, costPrice: 300, sellPrice: 500, unit: "piece", stock: 2, minStock: 20 },
    { name: "Instant Noodles", nameAr: "نودلز سريع", barcode: "6281004004005", sku: "SN-005", categoryId: snacks.id, supplierId: s3.id, costPrice: 250, sellPrice: 500, unit: "piece", stock: 100, minStock: 25 },
    { name: "Ketchup 500g", nameAr: "كاتشب 500غ", barcode: "6281007007005", sku: "CN-005", categoryId: canned.id, supplierId: s2.id, costPrice: 1100, sellPrice: 1700, unit: "piece", stock: 27, minStock: 8 },
    { name: "Mayonnaise 400g", nameAr: "مايونيز 400غ", barcode: "6281007007006", sku: "CN-006", categoryId: canned.id, supplierId: s2.id, costPrice: 1400, sellPrice: 2100, unit: "piece", stock: 19, minStock: 6 },
    { name: "Eggs 30-pack", nameAr: "بيض 30 قطعة", barcode: "6281005005005", sku: "DY-005", categoryId: dairy.id, supplierId: s1.id, costPrice: 5000, sellPrice: 7000, unit: "box", stock: 14, minStock: 5, expiresAt: daysFromNow(12) },
    { name: "Flour 1kg", nameAr: "طحين 1 كغ", barcode: "6281001001008", sku: "GR-008", categoryId: grains.id, supplierId: s1.id, costPrice: 800, sellPrice: 1200, unit: "piece", stock: 45, minStock: 12 },
  ];

  const products = [];
  for (const p of productData) {
    const product = await prisma.product.create({ data: p });
    products.push(product);
  }

  // Sample sales for last 14 days
  const sampleProducts = products.filter((p) => Number(p.stock) > 10).slice(0, 15);
  for (let day = 13; day >= 0; day--) {
    const salesCount = 3 + Math.floor(Math.random() * 5);
    for (let s = 0; s < salesCount; s++) {
      const itemCount = 1 + Math.floor(Math.random() * 4);
      const items = [];
      let subtotal = 0;
      for (let i = 0; i < itemCount; i++) {
        const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const qty = 1 + Math.floor(Math.random() * 3);
        const unitPrice = Number(product.sellPrice);
        const costPrice = Number(product.costPrice);
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;
        items.push({
          productId: product.id,
          quantity: qty,
          unitPrice,
          costPrice,
          lineTotal,
        });
      }
      const discount = Math.random() > 0.8 ? 500 : 0;
      const total = subtotal - discount;
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

      const sale = await prisma.sale.create({
        data: {
          receiptNo: `R${date.toISOString().slice(0, 10).replace(/-/g, "")}-${1000 + day * 10 + s}`,
          cashierId: Math.random() > 0.4 ? cashier.id : admin.id,
          subtotal,
          discount,
          total,
          paymentMethod: Math.random() > 0.3 ? PaymentMethod.CASH : PaymentMethod.CARD,
          amountPaid: total,
          change: 0,
          createdAt: date,
          items: { create: items },
        },
      });

      for (const item of items) {
        await prisma.stockLog.create({
          data: {
            productId: item.productId,
            userId: sale.cashierId,
            type: StockLogType.SALE,
            quantity: -item.quantity,
            unitCost: item.costPrice,
          },
        });
      }
    }
  }

  console.log("Seed complete!");
  console.log("Users:");
  console.log("  admin@store.local / admin123");
  console.log("  cashier@store.local / cashier123");
  console.log("  warehouse@store.local / warehouse123");
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
