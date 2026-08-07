import type { OrderStatus } from "@/generated/prisma/client";
import type { TKey } from "@/lib/i18n";

// Values are i18n keys (see src/lib/i18n.tsx) — consumers must call
// t(ORDER_STATUS_LABEL[status]) to get the display string.
export const ORDER_STATUS_LABEL: Record<OrderStatus, TKey> = {
  PENDING: "statusPending",
  CONFIRMED: "statusConfirmed",
  OUT_FOR_DELIVERY: "statusOutForDelivery",
  DELIVERED: "statusDelivered",
  CANCELLED: "statusCancelled",
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/20 text-amber-400",
  CONFIRMED: "bg-blue-500/20 text-blue-400",
  OUT_FOR_DELIVERY: "bg-purple-500/20 text-purple-400",
  DELIVERED: "bg-emerald-500/20 text-emerald-400",
  CANCELLED: "bg-gray-500/20 text-gray-400",
};

/**
 * Workflow with one-step undo: each status can move forward, or back to the
 * previous step to correct a mis-click. Reinstating a cancelled order
 * re-deducts stock (validated); cancelling restores it.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["OUT_FOR_DELIVERY", "PENDING", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CONFIRMED", "CANCELLED"],
  DELIVERED: ["OUT_FOR_DELIVERY"],
  CANCELLED: ["PENDING"],
};

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];
