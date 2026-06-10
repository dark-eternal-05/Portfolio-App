import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import applicationsRoutes from "./routes/applications.routes.js";
import whatsNewRoutes from "./routes/whatsnew.routes.js";

dotenv.config();

const app = express();

// const PORT = 3000;


app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend running",
  });
});

app.use(
  "/api/applications",
  applicationsRoutes,
);

app.use(
  "/api/whats-new",
  whatsNewRoutes,
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});