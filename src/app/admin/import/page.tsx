import { ImportForm } from "./ImportForm";

export default function ImportPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        Bulk import
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Upload the ordering sheet (.xlsx or .csv). Headers are matched
        flexibly in English or Chinese (品名, 货号, 装箱数, 克重, 库存...).
        Existing items are matched by SKU (or name within product) and
        updated; new ones are created. Always{" "}
        <strong>preview before importing</strong>.{" "}
        <a
          href="/import-template.csv"
          download
          className="text-blue-600 hover:underline"
        >
          Download template
        </a>
      </p>
      <ImportForm />
    </div>
  );
}
