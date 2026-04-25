"use server";
import { revalidatePath } from "next/cache";
import { fetchCompsStats, filterByTier, type Composition } from "@/lib/metatft-comps";

export async function revalidateHome() {
  revalidatePath("/");
}

export async function refreshSTierComps(): Promise<
  { ok: true; comps: Composition[] } | { ok: false; error: string }
> {
  try {
    const all = await fetchCompsStats({ revalidate: false });
    revalidatePath("/");
    return { ok: true, comps: filterByTier(all, "S") };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
