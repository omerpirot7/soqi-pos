"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Minus,
  Plus,
  Trash2,
  Pause,
  Play,
  CreditCard,
  Banknote,
  Search,
  Printer,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { completeSale, findProductByBarcode } from "@/lib/actions";
import { useCartStore } from "@/stores/cart-store";
import { useHoldSalesStore } from "@/stores/hold-sales-store";
import { useOfflineQueueStore } from "@/stores/offline-queue-store";
import { useBarcodeScanner, useKeyboardShortcuts } from "@/hooks/use-barcode-scanner";
import { toNumber, formatDate, cn } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";
import { ProductCard } from "@/components/pos/product-card";
import { ReceiptPrintLayout } from "@/components/receipt/receipt-print-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";

type Category = { id: string; name: string; nameCkb: string | null; color: string | null };
type Product = {
  id: string;
  name: string;
  nameCkb: string | null;
  barcode: string | null;
  sku?: string | null;
  sellPrice: number;
  costPrice: number;
  stock: number;
  unit: string;
  imageUrl: string | null;
  categoryId: string;
  category: Category;
};

type Settings = {
  storeName: string;
  logoUrl?: string | null;
  address: string | null;
  phone: string | null;
  receiptFooter: string | null;
  receiptWidthMm: number;
  currency: string;
} | null;

type CompletedSale = {
  id: string;
  receiptNo: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number | null;
  change: number | null;
  createdAt: string | Date;
  cashier: { name: string };
  items: {
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: { name: string; nameCkb: string | null };
  }[];
};

function PosCartPanel({
  className,
  onCheckout,
  onHold,
  onClear,
  onResumeHeld,
  compactEmpty,
}: {
  className?: string;
  onCheckout: () => void;
  onHold: () => void;
  onClear: () => void;
  onResumeHeld: (id: string) => void;
  compactEmpty?: boolean;
}) {
  const t = useTranslations("pos");
  const fmt = useFormatters();
  const cart = useCartStore();
  const holdStore = useHoldSalesStore();

  return (
    <div className={cn("flex min-h-0 flex-col bg-card", className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-bold">{t("cart")}</h2>
        <div className="flex gap-1">
          {holdStore.held.length > 0 && (
            <Badge variant="secondary">{holdStore.held.length}</Badge>
          )}
          <Button variant="ghost" size="icon" onClick={onHold} disabled={!cart.items.length} title={t("holdSale")}>
            <Pause className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear} disabled={!cart.items.length}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {holdStore.held.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b px-3 py-2">
          {holdStore.held.map((h) => (
            <Button key={h.id} variant="outline" size="sm" onClick={() => onResumeHeld(h.id)}>
              <Play className="h-3 w-3" />
              {h.label}
            </Button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {cart.items.length ? (
          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 rounded-xl bg-muted/40 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.nameCkb || item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt.currency(item.unitPrice)} × {fmt.number(item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => cart.decrement(item.productId)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-bold">{fmt.number(item.quantity)}</span>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => cart.increment(item.productId)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="w-20 text-end text-sm font-bold">
                  {fmt.currency(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("emptyCart")}
            className={cn("border-0", compactEmpty ? "py-6" : "h-full py-10")}
          />
        )}
      </div>

      <div className="space-y-3 border-t p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="font-medium">{fmt.currency(cart.subtotal())}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("discount")}</span>
          <Input
            type="number"
            min={0}
            value={cart.discount || ""}
            onChange={(e) => cart.setDiscount(Number(e.target.value) || 0)}
            className="h-10"
          />
        </div>
        <div className="flex items-center justify-between text-xl font-bold">
          <span>{t("total")}</span>
          <span className="text-primary">{fmt.currency(cart.total())}</span>
        </div>
        <Button size="xl" className="w-full" disabled={!cart.items.length} onClick={onCheckout}>
          {t("completeSale")}
        </Button>
      </div>
    </div>
  );
}

export function PosClient({
  categories,
  products: initialProducts,
  settings,
}: {
  categories: Category[];
  products: Product[];
  settings: Settings;
}) {
  const t = useTranslations("pos");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const fmt = useFormatters();
  const searchRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState(initialProducts);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [showPayment, setShowPayment] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showClear, setShowClear] = useState(false);
  const [completed, setCompleted] = useState<CompletedSale | null>(null);
  const [online, setOnline] = useState(true);

  const cart = useCartStore();
  const holdStore = useHoldSalesStore();
  const offlineQueue = useOfflineQueueStore();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryId === "all" || p.categoryId === categoryId;
      const q = query.trim().toLowerCase();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.nameCkb || "").includes(q) ||
        (p.barcode || "").includes(q);
      return matchCat && matchQ;
    });
  }, [products, categoryId, query]);

  const addProduct = useCallback(
    (product: Product) => {
      if (product.stock <= 0) {
        toast.error(t("outOfStock"));
        return;
      }
      cart.addItem({
        productId: product.id,
        name: product.name,
        nameCkb: product.nameCkb,
        barcode: product.barcode,
        unitPrice: toNumber(product.sellPrice),
        costPrice: toNumber(product.costPrice),
        unit: product.unit,
        stock: toNumber(product.stock),
        imageUrl: product.imageUrl,
      });
    },
    [cart, t]
  );

  const handleScan = useCallback(
    async (code: string) => {
      const local = products.find((p) => p.barcode === code || p.sku === code);
      if (local) {
        addProduct(local);
        setQuery("");
        return;
      }
      try {
        const product = await findProductByBarcode(code);
        if (!product) {
          toast.error(t("productNotFound"));
          return;
        }
        addProduct({
          ...product,
          category: { id: product.categoryId, name: "", nameCkb: null, color: null },
        } as Product);
      } catch {
        toast.error(t("productNotFound"));
      }
    },
    [products, addProduct, t]
  );

  useBarcodeScanner(handleScan);

  const shortcuts = useMemo(
    () => ({
      F2: () => searchRef.current?.focus(),
      F4: () => {
        if (cart.items.length) setShowPayment(true);
      },
      Escape: () => {
        setShowPayment(false);
        setCompleted(null);
      },
    }),
    [cart.items.length]
  );
  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Sync offline queue
  useEffect(() => {
    if (!online || !offlineQueue.queue.length) return;
    (async () => {
      for (const item of offlineQueue.queue) {
        try {
          await completeSale(item.payload);
          offlineQueue.dequeue(item.id);
          toast.success(t("saleComplete"));
        } catch {
          break;
        }
      }
    })();
  }, [online, offlineQueue, t]);

  async function handleComplete() {
    if (!cart.items.length) return;
    const payload = {
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        costPrice: i.costPrice,
      })),
      discount: cart.discount,
      paymentMethod: cart.paymentMethod,
      amountPaid: cart.paymentMethod === "CASH" ? cart.amountPaid || cart.total() : cart.total(),
    };

    if (!navigator.onLine) {
      offlineQueue.enqueue(payload);
      toast.success(t("offlineQueued"));
      cart.clear();
      setShowPayment(false);
      return;
    }

    startTransition(async () => {
      try {
        const result = await completeSale(payload);
        setProducts((prev) =>
          prev.map((p) => {
            const sold = payload.items.find((i) => i.productId === p.id);
            if (!sold) return p;
            return { ...p, stock: p.stock - sold.quantity };
          })
        );
        setCompleted(result.sale as unknown as CompletedSale);
        cart.clear();
        setShowPayment(false);
        toast.success(t("saleComplete"));
      } catch {
        toast.error(tCommon("error"));
      }
    });
  }

  function holdCurrent() {
    holdStore.hold(cart.items, cart.discount);
    cart.clear();
    toast.success(t("holdSale"));
  }

  function resumeHeld(id: string) {
    const sale = holdStore.resume(id);
    if (sale) {
      cart.loadItems(sale.items, sale.discount);
      toast.success(t("resumeSale"));
    }
  }

  function openCheckout() {
    cart.setAmountPaid(cart.total());
    setShowMobileCart(false);
    setShowPayment(true);
  }

  const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col gap-3 lg:flex-row animate-fade-in">
      {/* Products */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <div className="flex flex-col gap-2 no-print">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              data-barcode-input="true"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  handleScan(query.trim());
                }
              }}
              placeholder={t("searchOrScan")}
              className="h-14 pe-4 ps-11 text-lg"
              autoFocus
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryId("all")}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                categoryId === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {tCommon("all")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  categoryId === c.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
                style={
                  categoryId === c.id && c.color
                    ? { backgroundColor: c.color }
                    : undefined
                }
              >
                {c.nameCkb || c.name}
              </button>
            ))}
          </div>
          {!online && (
            <Badge variant="warning" className="w-fit">
              {tCommon("offline")}
            </Badge>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border bg-muted/20 p-3 no-print">
          {filtered.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  name={p.name}
                  nameCkb={p.nameCkb}
                  price={toNumber(p.sellPrice)}
                  stock={toNumber(p.stock)}
                  imageUrl={p.imageUrl}
                  color={p.category.color}
                  onClick={() => addProduct(p)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title={tCommon("noResults")} className="h-full border-0" />
          )}
        </div>
        <p className="hidden text-center text-xs text-muted-foreground no-print lg:block">{t("shortcuts")}</p>
      </div>

      {/* Desktop cart */}
      <div className="hidden w-[380px] flex-col rounded-xl border bg-card shadow-sm xl:w-[420px] lg:flex no-print">
        <PosCartPanel
          className="h-full rounded-xl"
          onCheckout={openCheckout}
          onHold={holdCurrent}
          onClear={() => setShowClear(true)}
          onResumeHeld={resumeHeld}
        />
      </div>

      {/* Mobile cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-lg no-print pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:hidden">
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => setShowMobileCart(true)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-start transition-colors hover:bg-muted"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShoppingBag className="h-4 w-4" />
              {cartItemCount > 0 && (
                <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {fmt.number(cartItemCount)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("cart")}</p>
              <p className="truncate text-base font-bold">{fmt.currency(cart.total())}</p>
            </div>
          </button>
          <Button
            className="shrink-0 self-stretch px-4"
            disabled={!cart.items.length}
            onClick={openCheckout}
          >
            {t("completeSale")}
          </Button>
        </div>
      </div>

      {/* Mobile cart sheet */}
      <Dialog open={showMobileCart} onOpenChange={setShowMobileCart}>
        <DialogContent className="!fixed !inset-x-0 !bottom-0 !top-auto !left-0 flex max-h-[88vh] w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl border-t p-0 sm:!rounded-t-2xl">
          <PosCartPanel
            className="max-h-[88vh]"
            compactEmpty
            onCheckout={openCheckout}
            onHold={holdCurrent}
            onClear={() => setShowClear(true)}
            onResumeHeld={resumeHeld}
          />
        </DialogContent>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("payment")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                variant={cart.paymentMethod === "CASH" ? "default" : "outline"}
                onClick={() => cart.setPaymentMethod("CASH")}
              >
                <Banknote className="h-5 w-5" />
                {t("cash")}
              </Button>
              <Button
                size="lg"
                variant={cart.paymentMethod === "CARD" ? "default" : "outline"}
                onClick={() => cart.setPaymentMethod("CARD")}
              >
                <CreditCard className="h-5 w-5" />
                {t("card")}
              </Button>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">{t("total")}</p>
              <p className="text-3xl font-bold text-primary">{fmt.currency(cart.total())}</p>
            </div>
            {cart.paymentMethod === "CASH" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("amountPaid")}</label>
                  <Input
                    type="number"
                    min={0}
                    value={cart.amountPaid || ""}
                    onChange={(e) => cart.setAmountPaid(Number(e.target.value) || 0)}
                    className="h-14 text-center text-2xl font-bold"
                  />
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t("change")}</span>
                  <span>{fmt.currency(cart.change())}</span>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>
              {tCommon("cancel")}
            </Button>
            <Button size="lg" onClick={handleComplete} disabled={pending}>
              {t("completeSale")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt preview */}
      <Dialog open={!!completed} onOpenChange={(o) => !o && setCompleted(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader className="no-print">
            <DialogTitle>{t("saleComplete")}</DialogTitle>
          </DialogHeader>
          {completed && (
            <ReceiptPrintLayout
              storeName={settings?.storeName || tCommon("appName")}
              logoUrl={settings?.logoUrl}
              address={settings?.address}
              phone={settings?.phone}
              receiptNo={completed.receiptNo}
              cashierName={completed.cashier.name}
              date={formatDate(completed.createdAt, locale)}
              items={completed.items.map((i) => ({
                name: i.product.nameCkb || i.product.name,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                lineTotal: i.lineTotal,
              }))}
              subtotal={completed.subtotal}
              discount={completed.discount}
              total={completed.total}
              paymentMethod={completed.paymentMethod}
              amountPaid={completed.amountPaid}
              change={completed.change}
              footer={settings?.receiptFooter}
              widthMm={settings?.receiptWidthMm}
              currency={settings?.currency}
            />
          )}
          <DialogFooter className="no-print">
            <Button variant="outline" onClick={() => setCompleted(null)}>
              {t("newSale")}
            </Button>
            <Button
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="h-4 w-4" />
              {t("printReceipt")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showClear}
        onOpenChange={setShowClear}
        title={t("clearCart")}
        onConfirm={() => {
          cart.clear();
          setShowClear(false);
        }}
        confirmLabel={tCommon("yes")}
        cancelLabel={tCommon("no")}
      />
    </div>
  );
}
