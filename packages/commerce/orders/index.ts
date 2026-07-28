export type OrderStatus = "pending" | "paid" | "packing" | "shipped" | "delivered" | "cancelled" | "returned" | "refunded";
export type Order = { id: string; status: OrderStatus; total: number; customerId: string };
