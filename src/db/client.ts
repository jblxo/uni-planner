import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleBsql } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "";
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

function isFileUrl(u: string | undefined) {
  return !!u && (u.startsWith("file:") || u.endsWith(".db"));
}

// Choose driver based on URL: libSQL for remote Turso/http(s), better-sqlite3 for local file
export const db = (() => {
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
  const client = createClient({ url: url || "", authToken });
  return drizzleLibsql(client, { schema });
})();
