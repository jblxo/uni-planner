import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./data/uni.db";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  // drizzle-kit doesn't always need auth for generate; migrate will be done programmatically
  dbCredentials: { url },
});
