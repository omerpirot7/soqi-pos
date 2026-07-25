"use client";

import { useLocale, useTranslations } from "next-intl";
import { isRtl } from "@/i18n/routing";
import { formatCurrency, formatNumber } from "@/lib/utils";

type ReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ReceiptPrintLayoutProps = {
  storeName: string;
  address?: string | null;
  phone?: string | null;
  receiptNo: string;
  cashierName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number | null;
  change?: number | null;
  footer?: string | null;
  widthMm?: number;
  currency?: string;
};

export function ReceiptPrintLayout({
  storeName,
  address,
  phone,
  receiptNo,
  cashierName,
  date,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  amountPaid,
  change,
  footer,
  widthMm = 80,
  currency = "IQD",
}: ReceiptPrintLayoutProps) {
  const t = useTranslations("receipt");
  const locale = useLocale();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <div
      id="receipt-print"
      className={`mx-auto bg-white p-3 text-black ${widthMm === 58 ? "receipt-58" : "receipt-80"}`}
      dir={dir}
      lang={locale}
    >
      <div className="text-center">
        <h2 className="text-lg font-bold">{storeName}</h2>
        {address && <p className="text-xs">{address}</p>}
        {phone && <p className="text-xs">{phone}</p>}
      </div>
      <hr className="my-2 border-dashed border-black/40" />
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between">
          <span>{receiptNo}</span>
          <span>{date}</span>
        </div>
        <div className="flex justify-between">
          <span>{cashierName}</span>
          <span>{paymentMethod}</span>
        </div>
      </div>
      <hr className="my-2 border-dashed border-black/40" />
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-black/20">
            <th className="py-1 text-start">{t("item")}</th>
            <th className="py-1 text-center">{t("qtyShort")}</th>
            <th className="py-1 text-end">{t("price")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="py-1 pe-1">{item.name}</td>
              <td className="py-1 text-center">{formatNumber(item.quantity, locale)}</td>
              <td className="py-1 text-end">
                {formatCurrency(item.lineTotal, currency, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2 border-dashed border-black/40" />
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>{t("subtotal")}</span>
          <span>{formatCurrency(subtotal, currency, locale)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span>{t("discount")}</span>
            <span>{formatCurrency(discount, currency, locale)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold">
          <span>{t("total")}</span>
          <span>{formatCurrency(total, currency, locale)}</span>
        </div>
        {amountPaid != null && (
          <div className="flex justify-between">
            <span>{t("amountPaid")}</span>
            <span>{formatCurrency(amountPaid, currency, locale)}</span>
          </div>
        )}
        {change != null && change > 0 && (
          <div className="flex justify-between">
            <span>{t("change")}</span>
            <span>{formatCurrency(change, currency, locale)}</span>
          </div>
        )}
      </div>
      {footer && (
        <>
          <hr className="my-2 border-dashed border-black/40" />
          <p className="text-center text-xs">{footer}</p>
        </>
      )}
    </div>
  );
}
