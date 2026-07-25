"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { upsertCategory, deleteCategory } from "@/lib/actions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Category = {
  id: string;
  name: string;
  nameAr: string | null;
  icon: string | null;
  color: string | null;
  _count?: { products: number };
  productCount?: number;
};

export function CategoriesClient({ categories: initial }: { categories: Category[] }) {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");
  const [categories, setCategories] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", nameAr: "", icon: "Package", color: "#15803d" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm({ name: "", nameAr: "", icon: "Package", color: "#15803d" });
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setForm({
      name: c.name,
      nameAr: c.nameAr || "",
      icon: c.icon || "Package",
      color: c.color || "#15803d",
    });
    setOpen(true);
  }

  function save() {
    if (!form.name) {
      toast.error(tCommon("required"));
      return;
    }
    startTransition(async () => {
      try {
        await upsertCategory({
          id: editing?.id,
          name: form.name,
          nameAr: form.nameAr,
          icon: form.icon,
          color: form.color,
        });
        toast.success(tCommon("success"));
        setOpen(false);
        window.location.reload();
      } catch {
        toast.error(tCommon("error"));
      }
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        actions={
          <Button size="lg" onClick={openCreate}>
            <Plus className="h-5 w-5" />
            {t("add")}
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState title={tCommon("noResults")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: c.color || "#15803d" }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">{c.nameAr || c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.name}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("productCount")}: {c.productCount ?? c._count?.products ?? 0}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("add")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t("name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("nameAr")}</Label>
              <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t("color")}</Label>
              <Input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-12 w-24 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("icon")}</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={save} disabled={pending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title={t("deleteConfirm")}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            try {
              await deleteCategory(deleteId);
              setCategories((prev) => prev.filter((c) => c.id !== deleteId));
              setDeleteId(null);
              toast.success(tCommon("success"));
            } catch {
              toast.error(tCommon("error"));
            }
          });
        }}
        confirmLabel={tCommon("delete")}
        cancelLabel={tCommon("cancel")}
      />
    </div>
  );
}
