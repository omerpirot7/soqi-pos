"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { ColumnDef } from "@tanstack/react-table";
import { upsertUser, setUserActive } from "@/lib/actions";
import { Role } from "@/types/enums";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale?: string;
  isActive: boolean;
};

export function UsersClient({ users: initial }: { users: User[] }) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [users, setUsers] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: Role.CASHIER as string,
    locale: "ckb",
  });
  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const [pending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", password: "", role: Role.CASHIER, locale: "ckb" });
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      locale: u.locale || "ckb",
    });
    setOpen(true);
  }

  function save() {
    if (!form.name || !form.email || (!editing && !form.password)) {
      toast.error(tCommon("required"));
      return;
    }
    startTransition(async () => {
      try {
        await upsertUser({
          id: editing?.id,
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          role: form.role as Role,
          locale: form.locale,
        });
        toast.success(tCommon("success"));
        setOpen(false);
        window.location.reload();
      } catch {
        toast.error(tCommon("error"));
      }
    });
  }

  const columns: ColumnDef<User>[] = [
    { accessorKey: "name", header: t("name") },
    { accessorKey: "email", header: t("email") },
    {
      accessorKey: "role",
      header: t("role"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {t(`roles.${row.original.role}` as "roles.ADMIN")}
        </Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: t("status"),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "outline"}>
          {row.original.isActive ? tCommon("active") : tCommon("inactive")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: tCommon("actions"),
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setToggleUser(row.original)}>
            {row.original.isActive ? t("deactivate") : t("activate")}
          </Button>
        </div>
      ),
    },
  ];

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

      <DataTable columns={columns} data={users} searchKey="name" />

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
              <Label>{t("email")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("password")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "••••••••" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("role")}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">{t("roles.ADMIN")}</SelectItem>
                  <SelectItem value="CASHIER">{t("roles.CASHIER")}</SelectItem>
                  <SelectItem value="WAREHOUSE">{t("roles.WAREHOUSE")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("locale")}</Label>
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
        open={!!toggleUser}
        onOpenChange={(o) => !o && setToggleUser(null)}
        title={toggleUser?.isActive ? t("deactivateConfirm") : t("activate")}
        onConfirm={() => {
          if (!toggleUser) return;
          startTransition(async () => {
            await setUserActive(toggleUser.id, !toggleUser.isActive);
            setUsers((prev) =>
              prev.map((u) =>
                u.id === toggleUser.id ? { ...u, isActive: !u.isActive } : u
              )
            );
            setToggleUser(null);
            toast.success(tCommon("success"));
          });
        }}
        confirmLabel={tCommon("confirm")}
        cancelLabel={tCommon("cancel")}
      />
    </div>
  );
}
