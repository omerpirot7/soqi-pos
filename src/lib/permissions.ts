import { Role } from "@/types/enums";

export type NavItem = {
  key: string;
  href: string;
  icon: string;
  roles: Role[];
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/", icon: "LayoutDashboard", roles: [Role.ADMIN] },
  { key: "pos", href: "/pos", icon: "ShoppingCart", roles: [Role.ADMIN, Role.CASHIER] },
  {
    key: "inventory",
    href: "/inventory",
    icon: "Package",
    roles: [Role.ADMIN, Role.WAREHOUSE],
  },
  {
    key: "categories",
    href: "/categories",
    icon: "Tags",
    roles: [Role.ADMIN, Role.WAREHOUSE],
  },
  {
    key: "suppliers",
    href: "/suppliers",
    icon: "Truck",
    roles: [Role.ADMIN, Role.WAREHOUSE],
  },
  {
    key: "sales",
    href: "/sales",
    icon: "Receipt",
    roles: [Role.ADMIN, Role.CASHIER],
  },
  {
    key: "labels",
    href: "/labels",
    icon: "Barcode",
    roles: [Role.ADMIN, Role.WAREHOUSE],
  },
  { key: "users", href: "/users", icon: "Users", roles: [Role.ADMIN] },
  { key: "settings", href: "/settings", icon: "Settings", roles: [Role.ADMIN] },
];

export function canAccess(role: Role, href: string): boolean {
  const item = NAV_ITEMS.find((n) => n.href === href || (href !== "/" && href.startsWith(n.href)));
  if (!item) return role === Role.ADMIN;
  return item.roles.includes(role);
}

export function getHomeForRole(role: Role): string {
  switch (role) {
    case Role.CASHIER:
      return "/pos";
    case Role.WAREHOUSE:
      return "/inventory";
    default:
      return "/";
  }
}

export function getNavForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
