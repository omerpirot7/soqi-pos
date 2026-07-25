const fs = require("fs");

const t = fs.readFileSync(".env.vercel", "utf8");
const lines = t.split(/\r?\n/);
const keys = new Set(["DATABSE_URL", "DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]);

for (const line of lines) {
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i);
  if (!keys.has(k)) continue;
  let v = line.slice(i + 1);
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  const kinds = {
    letters: (v.match(/[A-Za-z]/g) || []).length,
    digits: (v.match(/[0-9]/g) || []).length,
    stars: (v.match(/\*/g) || []).length,
    other: (v.match(/[^A-Za-z0-9*]/g) || []).length,
  };
  console.log(k + " | " + JSON.stringify(kinds) + " | allStars=" + /^\*+$/.test(v));
}
