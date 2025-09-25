import express from "express";
import cors from "cors";
import searchRouter from "./routes/search";

const app = express();
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.use("/api/search", searchRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on :${port}`));
