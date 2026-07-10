"use client";

import { useActionState } from "react";
import { setDeliveryDate, type ActionState } from "../../actions";

export function DeliveryDateForm({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const withId = setDeliveryDate.bind(null, orderId);
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => withId(prev, formData),
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        name="deliveryDate"
        defaultValue={current}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "..." : "Save"}
      </button>
      {state && "error" in state && (
        <p className="w-full text-xs text-red-600">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="w-full text-xs text-green-600">{state.success}</p>
      )}
    </form>
  );
}
