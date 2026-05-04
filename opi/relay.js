export const config = {
  runtime: 'edge', // فعال‌سازی حالت لبه برای سرعت حداکثری
};

export default async (request) => {
  const RELAY_URL = "your-project-name.vercel.app"; // آدرس ورسل خود را بعداً اینجا اصلاح کنید

  if (request.method === "GET") {
    return new Response("Vercel Relay is Active!", { status: 200 });
  }

  try {
    const req = await request.json();
    if (!req.u) return new Response(JSON.stringify({ e: "Missing URL" }), { status: 400 });

    const targetUrl = new URL(req.u);
    if (targetUrl.hostname.includes(RELAY_URL)) {
      return new Response(JSON.stringify({ e: "Self-fetch blocked" }), { status: 400 });
    }

    const headers = new Headers();
    if (req.h && typeof req.h === "object") {
      Object.entries(req.h).forEach(([k, v]) => {
        if (v) headers.set(k, String(v));
      });
    }
    headers.set("x-relay-hop", "1");

    const fetchOptions = {
      method: (req.m || "GET").toUpperCase(),
      headers: headers,
      redirect: req.r === false ? "manual" : "follow"
    };

    if (req.b) {
      fetchOptions.body = Uint8Array.from(atob(req.b), c => c.charCodeAt(0));
    }

    const resp = await fetch(req.u, fetchOptions);
    const buffer = await resp.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize));
    }

    return new Response(JSON.stringify({
      s: resp.status,
      h: Object.fromEntries(resp.headers.entries()),
      b: btoa(binary)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ e: String(err) }), { status: 500 });
  }
};