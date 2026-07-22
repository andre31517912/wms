"use client";

import { ImportForm } from "./ImportForm";
import { useI18n } from "@/lib/i18n";

export default function ImportPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">
        {t("bulkImport")}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {t("importDescription")}
      </p>
      <ImportForm />
    </div>
  );
}
