import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import produkRoutes from "./routes/produk.js";
import auditRoutes from "./routes/audit.js";
import customerRoutes from "./routes/customer.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files dari folder uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/produk", produkRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/customer", customerRoutes);

app.listen(5000, () => console.log("🚀 Server running on port 5000"));

export default app;
