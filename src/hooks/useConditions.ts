import { useEffect, useState } from "react";
import { dndConditions } from "@/lib/dndConditions";
import { fetchConditions } from "@/lib/db/rulesetCatalog";

export type ConditionCatalogItem = {
  slug: string;
  name: string;
  description: string;
};

function staticFallback(): ConditionCatalogItem[] {
  return dndConditions.map((c) => ({
    slug: c.index,
    name: c.name,
    description: c.description
  }));
}

/**
 * Load condition catalog from Supabase `conditions` table when seeded; otherwise bundled PHB24 JSON.
 *
 * @returns Catalog rows + loading flag.
 */
export function useConditions() {
  const [items, setItems] = useState<ConditionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const rows = await fetchConditions();
        if (cancelled) return;
        if (rows.length > 0) {
          setItems(rows.map((r) => ({ slug: r.slug, name: r.name, description: r.description })));
        } else {
          setItems(staticFallback());
        }
      } catch {
        if (!cancelled) {
          setItems(staticFallback());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading } as const;
}
