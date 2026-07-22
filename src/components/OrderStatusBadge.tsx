"use client";

import { useI18n } from "@/lib/i18n";
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/orderStatus";
import type { OrderStatus } from "@/generated/prisma/client";

export function OrderStatusBadge({
  status,
  size = "sm",
}: {
  status: OrderStatus;
  size?: "sm" | "md";
}) {
  const { t } = useI18n();
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";

  return (
    <span
      className={`rounded-full ${padding} text-xs font-medium ${ORDER_STATUS_BADGE[status]}`}
    >
      {t(ORDER_STATUS_LABEL[status])}
    </span>
  );
}
