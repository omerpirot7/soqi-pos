const base = "https://soqi-pos.vercel.app";

async function main() {
  const csrfResponse = await fetch(`${base}/api/auth/csrf`);
  const { csrfToken } = await csrfResponse.json();
  const cookie = csrfResponse.headers.get("set-cookie")?.split(";")[0] || "";

  const response = await fetch(
    `${base}/api/auth/callback/credentials?json=true`,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie,
      },
      body: new URLSearchParams({
        csrfToken,
        email: "admin@store.local",
        password: "admin123",
        json: "true",
      }),
      redirect: "manual",
    }
  );

  const text = await response.text();
  console.log("status=" + response.status);
  console.log("response=" + text.replace(/[?&]csrfToken=[^&\"]+/g, ""));
}

main().catch((error) => {
  console.error(error.name + ": " + error.message);
  process.exit(1);
});
