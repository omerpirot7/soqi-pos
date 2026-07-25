const fs = require("fs");
const path = require("path");

const vercelPath = path.join(process.cwd(), ".env.vercel");
if (!fs.existsSync(vercelPath)) {
  console.error("MISSING_.env.vercel");
  process.exit(1);
}

const lines = fs.readFileSync(vercelPath, "utf8").split(/\r?\n/);
const out = [];
let hasDb = false;

for (const line of lines) {
  if (!line || line.trim().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;

  let key = line.slice(0, i);
  let value = line.slice(i + 1);

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  // Vercel env was created with a typo
  if (key === "DATABSE_URL") key = "DATABASE_URL";

  if (key === "DATABASE_URL" || key === "NEXTAUTH_SECRET" || key === "NEXTAUTH_URL") {
    if (key === "DATABASE_URL") {
      hasDb = value.startsWith("postgresql://") || value.startsWith("postgres://");
      console.log(hasDb ? "DB_OK" : "DB_BAD_PROTOCOL");
    }
    out.push(`${key}="${value.replace(/"/g, '\\"')}"`);
  }
}

if (!hasDb) {
  console.error("NO_VALID_DATABASE_URL");
  process.exit(1);
}

fs.writeFileSync(path.join(process.cwd(), ".env"), out.join("\n") + "\n");
console.log("WROTE_.env");
