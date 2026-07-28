export type UserRole = "super_admin" | "admin" | "store_manager" | "inventory_manager" | "marketing_manager" | "customer_support" | "content_editor" | "customer";
export const hasRole = (role: UserRole, allowed: UserRole[]) => allowed.includes(role);
