import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stockLevel } from "@/lib/display";
import { updateItem } from "../../actions";
import { ItemForm } from "../ItemForm";
import { StockAdjustForm } from "./StockAdjustForm";
import { DeleteItemButton } from "./DeleteItemButton";
import { ItemPhotos } from "./ItemPhotos";

const LEVEL_TEXT = {
  in_stock: ["In stock", "text-green-700"],
  low: ["Low stock", "text-amber-700"],
  out: ["Out of stock", "text-red-700"],
} as const;

export default async function ItemDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [item, products] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: {
        product: true,
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true },
        },
        adjustments: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  if (!item) notFound();

  const level = stockLevel(item.stockCases, item.lowStockThreshold);
  const [levelLabel, levelCls] = LEVEL_TEXT[level];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{item.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {item.sku ? `SKU ${item.sku} · ` : ""}
            {item.product.name}
          </p>
        </div>
        <DeleteItemButton itemId={item.id} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Current stock</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {item.stockCases}
            <span className="ml-1 text-base font-normal text-gray-400">
              cases
            </span>
          </p>
          <p className={`mt-1 text-sm font-medium ${levelCls}`}>{levelLabel}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm sm:col-span-2">
          <p className="mb-3 text-sm font-medium text-gray-700">Adjust stock</p>
          <StockAdjustForm itemId={item.id} />
        </div>
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Photos</h2>
        <ItemPhotos itemId={item.id} photos={item.images} />
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-900">Item details</h2>
        <ItemForm
          action={updateItem.bind(null, item.id)}
          products={products.map((p) => ({ id: p.id, label: p.name }))}
          initial={{
            productId: item.productId,
            sku: item.sku,
            name: item.name,
            detail: item.detail,
            unitWeightG: item.unitWeightG,
            piecesPerCase: item.piecesPerCase,
            caseLengthCm: item.caseLengthCm,
            caseWidthCm: item.caseWidthCm,
            caseHeightCm: item.caseHeightCm,
            minOrderCases: item.minOrderCases,
            lowStockThreshold: item.lowStockThreshold,
            isActive: item.isActive,
          }}
          submitLabel="Save changes"
        />
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b border-gray-100 px-6 py-4 text-lg font-medium text-gray-900">
          Stock history
        </h2>
        {item.adjustments.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">
            No stock movements yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-2">When</th>
                <th className="px-6 py-2">Change</th>
                <th className="px-6 py-2">Reason</th>
                <th className="px-6 py-2">By</th>
                <th className="px-6 py-2">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {item.adjustments.map((a) => (
                <tr key={a.id}>
                  <td className="px-6 py-2 text-gray-500">
                    {a.createdAt.toLocaleString("en-CA", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td
                    className={`px-6 py-2 font-medium ${a.deltaCases > 0 ? "text-green-700" : "text-red-700"}`}
                  >
                    {a.deltaCases > 0 ? `+${a.deltaCases}` : a.deltaCases}
                  </td>
                  <td className="px-6 py-2 text-gray-600">{a.reason}</td>
                  <td className="px-6 py-2 text-gray-600">
                    {a.user?.name ?? "—"}
                  </td>
                  <td className="px-6 py-2 text-gray-500">{a.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
