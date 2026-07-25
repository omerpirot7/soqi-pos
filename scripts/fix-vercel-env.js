const { execSync } = require("child_process");
const fs = require("fs");

function parseEnv(filePath) {
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
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
    out[key] = value;
  }
  return out;
}

function run(cmd, input) {
  console.log("RUN:", cmd.replace(/\s+/g, " ").trim());
  execSync(cmd, {
    input,
    stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
    shell: true,
  });
}

const env = parseEnv(".env");
if (!env.DATABASE_URL) {
  console.error("LOCAL_.env missing DATABASE_URL");
  process.exit(1);
}
if (!env.NEXTAUTH_SECRET || !env.NEXTAUTH_URL) {
  console.error("LOCAL_.env missing NEXTAUTH_SECRET or NEXTAUTH_URL");
  process.exit(1);
}

const targets = ["production", "preview"];

// Remove typo key if present (ignore failures)
for (const target of targets) {
  try {
    run(`npx.cmd vercel env rm DATABSE_URL ${target} -y`);
  } catch {
    console.log("SKIP_RM_DATABSE_URL_" + target);
  }
}

// Remove existing correct keys so we can re-add fresh values
for (const key of ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]) {
  for (const target of targets) {
    try {
      run(`npx.cmd vercel env rm ${key} ${target} -y`);
    } catch {
      console.log(`SKIP_RM_${key}_${target}`);
    }
  }
}

// Add correct values
for (const target of targets) {
  run(`npx.cmd vercel env add DATABASE_URL ${target}`, env.DATABASE_URL + "\n");
  run(
    `npx.cmd vercel env add NEXTAUTH_SECRET ${target}`,
    env.NEXTAUTH_SECRET + "\n"
  );
  run(
    `npx.cmd vercel env add NEXTAUTH_URL ${target}`,
    env.NEXTAUTH_URL + "\n"
  );
}

console.log("ENV_UPDATE_DONE");
