import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import bodyParser from "body-parser";

/**
 * SmartSaver API
 *  - GET  /healthz
 *  - GET  /debug/routes
 *  - POST /api/checkout
 *  - POST /api/portal
 *  - POST /webhooks/stripe
 */

const app = express();

// --- Strict CORS: allow only your frontends
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ALLOWED_ORIGINS = new Set([FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"]);
app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser tools (curl/postman) with no origin
      if (!origin) return cb(null, true);
      cb(null, ALLOWED_ORIGINS.has(origin));
    },
    credentials: true,
  })
);

// JSON for normal routes (webhook uses raw below)
app.use(express.json());

// --- Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });

app.get("/healthz", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.get("/debug/routes", (_req, res) => {
  // @ts-ignore
  const stack = app._router?.stack || [];
  const routes = stack
    .filter((l: any) => l?.route)
    .map((l: any) => ({ methods: Object.keys(l.route.methods), path: l.route.path }));
  res.json({
    built: new Date().toISOString(),
    routes,
    stripeConfigured: true,
    frontendUrl: FRONTEND_URL,
    corsAllowed: Array.from(ALLOWED_ORIGINS),
  });
});

// ---------- CHECKOUT ----------
app.post("/api/checkout", async (req, res) => {
  try {
    const { userId, email, plan = "monthly" } = (req.body || {}) as {
      userId?: string; email?: string; plan?: "monthly" | "yearly";
    };
    if (!userId || !email) return res.status(400).json({ error: "Missing userId or email" });

    const PRICES = { monthly: { amount: 999, interval: "month" }, yearly: { amount: 9900, interval: "year" } } as const;
    const cfg = PRICES[plan] || PRICES.monthly;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card", "link"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `SmartSaver Premium (${cfg.interval})` },
          unit_amount: cfg.amount,
          recurring: { interval: cfg.interval },
        },
        quantity: 1
      }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${FRONTEND_URL}/success`,
      cancel_url: `${FRONTEND_URL}/canceled`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: err?.message || "checkout failed" });
  }
});

// ---------- BILLING PORTAL (needs customerId from DB) ----------
app.post("/api/portal", async (req, res) => {
  try {
    const { customerId } = (req.body || {}) as { customerId?: string };
    if (!customerId) return res.status(400).json({ error: "Missing customerId" });

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/account`,
    });

    res.json({ url: portal.url });
  } catch (err: any) {
    console.error("Portal error:", err);
    res.status(500).json({ error: err?.message || "portal failed" });
  }
});

// ---------- WEBHOOKS (raw body for signature) ----------
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
app.post("/webhooks/stripe", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"] as string,
      webhookSecret
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || null;
        const customerId = session.customer as string | null;
        if (userId && customerId) {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/profiles`, {
            method: "PATCH",
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              id: userId,
              stripe_customer_id: customerId,
              subscription_status: "active",
            }),
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status;
        await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${encodeURIComponent(customerId)}`,
          {
            method: "PATCH",
            headers: {
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({ subscription_status: status }),
          }
        );
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler failed:", err?.message || err);
    res.status(400).send("webhook error");
  }
});

// 404
app.use((_req, res) => res.status(404).send("Not found"));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening on :${port}`));