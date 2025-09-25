// src/utils/checkout.ts
export async function startCheckout(
  userId?: string,
  email?: string,
  plan: "monthly" | "yearly" = "monthly"
) {
  const api = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${api}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, email, plan }),
  });
  const data = await res.json();
  if (data?.url) window.location.href = data.url;
  else alert(data?.error || "Checkout failed");
}

export async function openBillingPortal(customerId: string) {
  const api = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${api}/api/portal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerId }),
  });
  const data = await res.json();
  if (data?.url) window.location.href = data.url;
  else alert(data?.error || "Could not open billing portal");
}