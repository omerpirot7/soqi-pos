"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { updateSettings } from "@/lib/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Settings = {
  storeName: string;
  address: string | null;
  phone: string | null;
  currency: string;
  receiptFooter: string | null;
  locale: string;
  receiptWidthMm: number;
  logoUrl: string | null;
};

export function SettingsClient({ settings }: { settings: Settings }) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [form, setForm] = useState({
    storeName: settings.storeName,
    address: settings.address || "",
    phone: settings.phone || "",
    currency: settings.currency,
    receiptFooter: settings.receiptFooter || "",
    locale: settings.locale,
    receiptWidthMm: settings.receiptWidthMm,
    logoUrl: settings.logoUrl || "",
  });
  const [pending, startTransition] = useTransition();

  function save() {
    if (!form.storeName) {
      toast.error(tCommon("required"));
      return;
    }
    startTransition(async () => {
      try {
        await updateSettings({
          storeName: form.storeName,
          address: form.address,
          phone: form.phone,
          currency: form.currency,
          receiptFooter: form.receiptFooter,
          locale: form.locale,
          receiptWidthMm: form.receiptWidthMm,
          logoUrl: form.logoUrl.trim() || null,
        });
        toast.success(t("saved"));
      } catch {
        toast.error(tCommon("error"));
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <PageHeader title={t("title")} />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label>{t("storeName")}</Label>
            <Input
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("logo")}</Label>
            <Input
              type="url"
              placeholder="https://..."
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("address")}</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("phone")}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("currency")}</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm({ ...form, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IQD">IQD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("receiptWidth")}</Label>
              <Select
                value={String(form.receiptWidthMm)}
                onValueChange={(v) => setForm({ ...form, receiptWidthMm: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm</SelectItem>
                  <SelectItem value="80">80mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("language")}</Label>
            <Select value={form.locale} onValueChange={(v) => setForm({ ...form, locale: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ckb">کوردی</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("receiptFooter")}</Label>
            <Textarea
              value={form.receiptFooter}
              onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
            />
          </div>
          <Button size="lg" className="w-full" onClick={save} disabled={pending}>
            {tCommon("save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
