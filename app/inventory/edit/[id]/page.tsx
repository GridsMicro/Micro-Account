import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import EditProductClient from "./EditProductClient";

export const dynamic = 'force-dynamic';

async function getProduct(id: string) {
  try {
    const res = await query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return <EditProductClient product={product} />;
}
