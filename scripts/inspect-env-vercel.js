const fs = require("fs");

const t = fs.readFileSync(".env.vercel", "utf8");
const lines = t.split(/\r?\n/);

for (const line of lines) {
  if (!line) {
    console.log("EMPTY");
    continue;
  }
  if (line.startsWith("#")) {
    console.log("COMMENT");
    continue;
  }
  const i = line.indexOf("=");
  if (i < 0) {
    console.log("NOEQ");
    continue;
  }
  const k = line.slice(0, i);
  let v = line.slice(i + 1);
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  const protoMatch = v.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/);
  console.log(
    [
      k,
      "len=" + v.length,
      "empty=" + (v.length === 0),
      "proto=" + (protoMatch ? protoMatch[0] : "none"),
      "hasAt=" + v.includes("@"),
      "hasNeon=" + v.toLowerCase().includes("neon"),
      "startsFile=" + v.startsWith("file:"),
    ].join(" | ")
  );
}
