import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Result = { id?: string; name?: string; price?: number; store?: string; category?: string };

const API_BASE = import.meta.env.VITE_API_BASE;

export default function App() {
  // shared form state
  const [zip, setZip] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"groceries" | "all">("groceries");
  const isFree = category === "groceries";

  // fetch mock/product list (your backend can add real filters later)
  const { data, isFetching, refetch } = useQuery<Result[]>({
    queryKey: ["search", zip, query, category],
    enabled: false, // run only when user clicks Search
    queryFn: async () => {
      const url = new URL(`${API_BASE}/api/products/list`);
      // Send what the backend will eventually support:
      url.searchParams.set("zip", zip);
      url.searchParams.set("q", query);
      url.searchParams.set("category", category);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            <span className="font-extrabold tracking-tight">SmartSaver</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#pricing" className="hover:text-indigo-600">Pricing</a>
            <a href={API_BASE + "/api/health"} target="_blank" className="hover:text-indigo-600">API Health</a>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* HERO + SEARCH */}
      <header className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(79,70,229,0.20),transparent)]" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-6 grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <Badge variant="secondary" className="rounded-full px-3 py-1">New</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Compare prices in seconds. <span className="text-indigo-600">Start free.</span>
            </h1>
            <p className="text-slate-600">
              Free plan searches <span className="font-medium">Groceries</span>. Premium unlocks <span className="font-medium">all departments</span> across 200+ retailers.
            </p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Search</CardTitle>
              <CardDescription>Free users search Groceries. Premium searches Everything.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="free" onValueChange={(v) => setCategory(v === "free" ? "groceries" : "all")}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="free">Free</TabsTrigger>
                  <TabsTrigger value="premium">Premium</TabsTrigger>
                </TabsList>

                {/* FREE TAB */}
                <TabsContent value="free" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">ZIP code</Label>
                      <Input id="zip" placeholder="e.g. 49201" value={zip} onChange={(e) => setZip(e.target.value)} />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value="Groceries" readOnly className="bg-slate-100" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="q">Product or brand</Label>
                    <Input id="q" placeholder="e.g. milk, eggs, bread…" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </div>
                </TabsContent>

                {/* PREMIUM TAB */}
                <TabsContent value="premium" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip2">ZIP code</Label>
                      <Input id="zip2" placeholder="e.g. 49201" value={zip} onChange={(e) => setZip(e.target.value)} />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={category === "all" ? "all" : "groceries"} onValueChange={(v) => setCategory(v === "all" ? "all" : "groceries")}>
                        <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everything (Premium)</SelectItem>
                          <SelectItem value="groceries">Groceries</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="q2">Product or brand</Label>
                    <Input id="q2" placeholder="e.g. TV, cereal, sneakers…" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </div>
                  <p className="text-xs text-slate-500">Premium includes all departments and advanced filters.</p>
                </TabsContent>
              </Tabs>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!zip || !query}
                onClick={() => refetch()}
              >
                {isFetching ? "Searching…" : `Search ${isFree ? "Groceries (Free)" : "Everything (Premium)"}`}
              </Button>

              {/* RESULTS */}
              {data && (
                <div className="mt-4 space-y-2">
                  {data.length === 0 ? (
                    <p className="text-sm text-slate-500">No results yet (or backend returns empty list). We’ll wire real filters next.</p>
                  ) : (
                    <ul className="divide-y rounded border">
                      {data.map((r, i) => (
                        <li key={r.id ?? i} className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{r.name}</p>
                            <p className="text-xs text-slate-500">{r.store} • {r.category}</p>
                          </div>
                          <p className="font-semibold">${r.price?.toFixed(2)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </header>

      {/* PRICING */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* FREE */}
            <Card className="border-green-300">
              <CardHeader>
                <CardTitle className="text-green-600">Free</CardTitle>
                <CardDescription>Start saving on groceries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✅ Grocery comparisons</p>
                <p>✅ Search across 50 states</p>
                <p>❌ All-department search</p>
                <Button className="w-full mt-2 bg-green-600 hover:bg-green-700">Start Free</Button>
              </CardContent>
            </Card>

            {/* PREMIUM */}
            <Card className="border-purple-400 shadow-lg">
              <CardHeader>
                <CardTitle className="text-purple-600">Premium</CardTitle>
                <CardDescription>Unlock the full SmartSaver experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>✅ Everything in Free</p>
                <p>✅ All departments (electronics, home, apparel, …)</p>
                <p>✅ 200+ retailers</p>
                <p>✅ Advanced filters</p>
                <Button className="w-full mt-2 bg-purple-600 hover:bg-purple-700">Upgrade to Premium</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} SmartSaver. All rights reserved.
      </footer>
    </div>
  );
}
