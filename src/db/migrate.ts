import { migrate as migrateLibsql } from "drizzle-orm/libsql/migrator";
import { migrate as migrateBsql } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "";
const isFile = !!url && (url.startsWith("file:") || url.endsWith(".db"));

async function main() {
  if (isFile) {
    // @ts-expect-error - Drizzle migration type mismatch between sync/async modes
    await migrateBsql(db, { migrationsFolder: "./drizzle" });
  } else {
    // @ts-expect-error - Drizzle migration type mismatch between sync/async modes  
    await migrateLibsql(db, { migrationsFolder: "./drizzle" });
  }
  console.log("Migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
