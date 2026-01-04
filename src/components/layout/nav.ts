import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  Users,
  ShoppingCart,
  Receipt,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/dashboard/sales", label: "Sales", icon: Receipt },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];


