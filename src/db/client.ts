import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleBsql } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

function isFileUrl(u: string | undefined) {
  return !!u && (u.startsWith("file:") || u.endsWith(".db"));
}

type DrizzleDb = ReturnType<typeof drizzleLibsql<typeof schema>> | ReturnType<typeof drizzleBsql<typeof schema>>;

// Choose driver based on URL: libSQL for remote Turso/http(s), better-sqlite3 for local file
export const db = (() => {
  // During build phase with no URL, return null to prevent connection errors
  if (process.env.NEXT_PHASE === "phase-production-build" && !url) {
    return null as unknown as DrizzleDb;
  }
  
  if (isFileUrl(url)) {
    let Database;
    try {
      Database = eval('require')("better-sqlite3");
    } catch {
      throw new Error("better-sqlite3 is required for local database files");
    }
    const sqlite = new Database(url.replace("file:", "") || "./data/uni.db");
    return drizzleBsql(sqlite, { schema });
  }
  
  if (!url) {
    throw new Error("DATABASE_URL or TURSO_DATABASE_URL environment variable is required");
  }
  
  const client = createClient({ url, authToken });
  return drizzleLibsql(client, { schema });
})();
