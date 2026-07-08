import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { bilingual, stockLevel } from "@/lib/display";
import { updateProduct } from "../../actions";
import { ProductForm } from "../ProductForm";
import { StockAdjustForm } from "./StockAdjustForm";
import { DeleteProductButton } from "./DeleteProductButton";

const LEVEL_TEXT = {
  in_stock: ["In stock", "text-green-700"],
  low: ["Low stock", "text-amber-700"],
  out: ["Out of stock", "text-red-700"],
} as const;

export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        adjustments: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  if (!product) notFound();

  const level = stockLevel(product.stockCases, product.lowStockThreshold);
  const [levelLabel, levelCls] = LEVEL_TEXT[level];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {bilingual(product.nameZh, product.nameEn)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {product.sku ? `SKU ${product.sku} · ` : ""}
            {bilingual(product.category.nameZh, product.category.nameEn)}
          </p>
        </div>
        <DeleteProductButton productId={product.id} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Current stock</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {product.stockCases}
            <span className="ml-1 text-base font-normal text-gray-400">
              cases
            </span>
          </p>
          <p className={`mt-1 text-sm font-medium ${levelCls}`}>{levelLabel}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm sm:col-span-2">
          <p className="mb-3 text-sm font-medium text-gray-700">
            Adjust stock
          </p>
          <StockAdjustForm productId={product.id} />
        </div>
      </div>

      <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-gray-900">
          Product details
        </h2>
        <ProductForm
          action={updateProduct.bind(null, product.id)}
          categories={categories.map((c) => ({
            id: c.id,
            label: bilingual(c.nameZh, c.nameEn),
          }))}
          initial={{
            categoryId: product.categoryId,
            sku: product.sku,
            nameEn: product.nameEn,
            nameZh: product.nameZh,
            detailEn: product.detailEn,
            detailZh: product.detailZh,
            unitWeightG: product.unitWeightG,
            piecesPerCase: product.piecesPerCase,
            caseLengthCm: product.caseLengthCm,
            caseWidthCm: product.caseWidthCm,
            caseHeightCm: product.caseHeightCm,
            minOrderCases: product.minOrderCases,
            lowStockThreshold: product.lowStockThreshold,
            isActive: product.isActive,
          }}
          submitLabel="Save changes"
        />
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b border-gray-100 px-6 py-4 text-lg font-medium text-gray-900">
          Stock history
        </h2>
        {product.adjustments.length === 0 ? (
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
              {product.adjustments.map((a) => (
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
