import { redirect } from "next/navigation";

// Items are managed inside the combined Products & Items explorer now
export default function ItemsPage() {
  redirect("/admin/products");
}
