const fs = require("fs");

const path = process.argv[2] || ".env";
if (!fs.existsSync(path)) {
  console.log("MISSING_.env");
  process.exit(1);
}

const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
const found = {};

for (const line of lines) {
  if (!line || line.trim().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  let key = line.slice(0, i).trim();
  let value = line.slice(i + 1).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  found[key] = value;
}

const db = found.DATABASE_URL || found.DATABSE_URL;
const dbKey = found.DATABASE_URL
  ? "DATABASE_URL"
  : found.DATABSE_URL
    ? "DATABSE_URL"
    : "MISSING";

console.log("db_key=" + dbKey);
if (!db) {
  console.log("db_status=MISSING");
} else {
  const ok =
    db.startsWith("postgresql://") || db.startsWith("postgres://");
  console.log("db_status=" + (ok ? "OK_POSTGRES" : "BAD_PROTOCOL"));
  console.log("db_len=" + db.length);
  console.log("db_has_neon=" + /neon\.tech/i.test(db));
  console.log("db_has_ssl=" + /sslmode=/i.test(db));
}

console.log(
  "has_NEXTAUTH_SECRET=" + Boolean(found.NEXTAUTH_SECRET && found.NEXTAUTH_SECRET.length > 8)
);
console.log(
  "has_NEXTAUTH_URL=" + Boolean(found.NEXTAUTH_URL && found.NEXTAUTH_URL.length > 0)
);
if (found.NEXTAUTH_URL) {
  console.log(
    "nextauth_url_is_https=" + found.NEXTAUTH_URL.startsWith("https://")
  );
  console.log(
    "nextauth_url_looks_vercel=" + /vercel\.app/i.test(found.NEXTAUTH_URL)
  );
}
