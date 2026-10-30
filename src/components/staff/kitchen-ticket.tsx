import type { JSX } from "react";
import { OrderState, type Order } from "@/domain/orders/order.repository";
import { Button } from "@/components/ui/button";
import { ElapsedTimer } from "./elapsed-timer";

export interface KitchenTicketProps {
  readonly order: Order;
  readonly place: { readonly number: string; readonly type: string };
  readonly now: number;
}

function parseModifiers(modifiersJson: unknown): string[] {
  if (!Array.isArray(modifiersJson)) {
    return [];
  }
  const result: string[] = [];
  for (const item of modifiersJson) {
    if (typeof item === "object" && item !== null) {
      const record = item as Record<string, unknown>;
      if (typeof record["option"] === "string") {
        result.push(record["option"]);
      } else if (typeof record["name"] === "string") {
        result.push(record["name"]);
      }
    }
  }
  return result;
}

function getActionButtonLabel(state: OrderState): string {
  switch (state) {
    case OrderState.APPROVED:
    case OrderState.PLACED:
      return "Start";
    case OrderState.PREPARING:
      return "Ready";
    case OrderState.READY:
      return "Done";
    default:
      return "View";
  }
}

export function KitchenTicket({
  order,
  place,
  now,
}: KitchenTicketProps): JSX.Element {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((now - new Date(order.placedAt).getTime()) / 60000)
  );
  const isStale = elapsedMinutes >= 15;

  return (
    <article
      className={`bg-staff-surface-raised rounded-lg p-5 flex flex-col justify-between gap-4 ${
        isStale
          ? "border-2 border-[var(--color-status-active)]"
          : "border border-staff-border-subtle"
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Header Row: Order ID & Elapsed Time */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[20px] font-semibold text-staff-text-primary tracking-tight">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <ElapsedTimer placedAt={order.placedAt} />
        </div>

        {/* Place Row: Table/Room number in 40px (The Place) */}
        <div className="flex flex-col">
          <span className="text-[40px] leading-[44px] font-semibold text-staff-text-primary tracking-tight">
            {place.number}
          </span>
          <span className="text-[12px] uppercase tracking-wider text-staff-text-muted font-medium">
            {place.type}
          </span>
        </div>

        {/* Divider */}
        <hr className="border-t border-staff-border-subtle" />

        {/* Items List */}
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => {
            const modifiers = parseModifiers(item.modifiersJson);
            return (
              <li key={item.id} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  {item.quantity > 1 && (
                    <span className="font-mono text-[16px] font-medium text-staff-text-muted">
                      {item.quantity}×
                    </span>
                  )}
                  <span className="text-[18px] font-medium text-staff-text-primary leading-snug">
                    {item.itemName}
                  </span>
                </div>
                {modifiers.length > 0 && (
                  <p className="text-[14px] text-staff-text-muted pl-3">
                    {modifiers.join(", ")}
                  </p>
                )}
                {item.notes !== null && item.notes.trim() !== "" && (
                  <p className="text-[14px] text-staff-text-primary pl-2 border-l-2 border-[var(--color-status-active)] italic">
                    {item.notes}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        {/* Order-level notes */}
        {order.notes !== null && order.notes.trim() !== "" && (
          <div className="pt-2 border-t border-staff-border-subtle">
            <p className="text-[14px] text-staff-text-primary pl-2 border-l-2 border-[var(--color-status-active)] italic">
              <span className="font-medium not-italic text-staff-text-muted mr-1">
                Note:
              </span>
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Footer Action Button (Disabled Placeholder) */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          disabled
          className="w-full"
        >
          {getActionButtonLabel(order.state)}
        </Button>
      </div>
    </article>
  );
}
