import { Router } from "express";
import { z } from "zod";

const router = Router();

const QuerySchema = z.object({
  q: z.string().trim().min(1),
  zip: z.string().trim().length(5).optional(),
});

const DEMO_RESULTS = [
  { id: 1, title: "Whole Milk, 1 Gallon", retailer: "MegaMart", price: 3.49, imageUrl: "", productUrl: "#" },
  { id: 2, title: "Large Eggs, 12 ct",   retailer: "BudgetFoods", price: 2.39, imageUrl: "", productUrl: "#" },
  { id: 3, title: "Chicken Breast, 1 lb", retailer: "SuperSaver",  price: 2.99, imageUrl: "", productUrl: "#" },
];

router.get("/", async (req, res) => {
  const parsed = QuerySchema.safeParse({ q: req.query.q ?? "", zip: req.query.zip ?? undefined });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { q } = parsed.data;
  const filtered = DEMO_RESULTS.filter(r => r.title.toLowerCase().includes(q.toLowerCase()));
  return res.json({ results: filtered.slice(0, 12), mode: "demo" });
});

export default router;
