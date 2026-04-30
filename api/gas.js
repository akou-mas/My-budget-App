/**
 * ブラウザ → 同一オリジン(/api/gas) → GAS へ中継（LINE WebView 等での「Failed to fetch」回避）
 * デプロイ後の GAS URL は Vercel の Environment Variables で GAS_URL を上書き可能
 */
const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbwsEXC_riVRpdpqn7Q8Q4nrm23Gko3Eru7u789lTdkRZN-zXQNv9KbIv_uwBmpyGFBSiQ/exec";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const gasUrl = process.env.GAS_URL || DEFAULT_GAS_URL;
  const rawBody =
    typeof req.body === "string"
      ? req.body
      : req.body && typeof req.body === "object"
        ? JSON.stringify(req.body)
        : "{}";

  try {
    const gasRes = await fetch(gasUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: rawBody,
    });
    const text = await gasRes.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(gasRes.status).send(text);
  } catch (e) {
    console.error("api/gas proxy", e);
    return res.status(502).json({
      error: "gas_proxy_failed",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
