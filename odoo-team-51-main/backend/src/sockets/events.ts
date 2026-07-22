/** Central event-name registry — every service emits via these constants
 * so the real-time layer stays consistent across modules and matches the
 * frontend's frozen contract exactly. */
export const SOCKET_EVENTS = {
  ORDER_STATUS_CHANGED: "order:status_changed",
  STOCK_UPDATED: "stock:updated",
  SIGNAL_CREATED: "signal:created",
  AUDIT_ENTRY_CREATED: "audit:entry_created",
  INTEL_POST_CREATED: "intel:post_created",
  INTEL_POST_VERIFIED: "intel:post_verified",
} as const;

export interface OrderStatusChangedPayload {
  orderType: "sales_order" | "purchase_order" | "manufacturing_order";
  orderId: number;
  newStatus: string;
}

export interface StockUpdatedPayload {
  productId: number;
  onHandQty: number;
  freeToUseQty: number;
}

export interface AuditEntryCreatedPayload {
  row: {
    id: number;
    entity: string;
    recordId: number;
    action: string;
    fieldChanged?: string | null;
    userId?: number | null;
    createdAt: Date;
  };
}
