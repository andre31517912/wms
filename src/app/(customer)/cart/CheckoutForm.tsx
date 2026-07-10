"use client";

import { useActionState } from "react";
import { placeOrder, type CartActionState } from "../actions";

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(
    async (prev: CartActionState, formData: FormData) =>
      placeOrder(prev, formData),
    null
  );

  return (
    <form action={formAction}>
      <label className="mb-1 block text-xs text-gray-500" htmlFor="note">
        Note for the supplier (optional)
      </label>
      <textarea
        id="note"
        name="note"
        rows={2}
        maxLength={500}
        placeholder="Delivery instructions, preferred date..."
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
      />
      {state && "error" in state && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Placing order..." : "Place order"}
      </button>
      <p className="mt-2 text-center text-xs text-gray-400">
        Stock is reserved when the order is placed. The supplier will confirm
        and schedule delivery.
      </p>
    </form>
  );
}
