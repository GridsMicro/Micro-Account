import { NextResponse } from "next/server";

const FX_API = "https://api.frankfurter.dev/v2";
const SOURCE_LABEL = "Bank of Thailand reference rate (BOT via frankfurter.dev)";

const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchJson<T>(url: string, cacheKey: string, ttlMs: number): Promise<T> {
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    throw new Error(`FX API responded ${res.status}`);
  }
  const data = (await res.json()) as T;
  cache.set(cacheKey, { data, expiresAt: now + ttlMs });
  return data;
}

type FrankfurterRate = { date: string; base: string; quote: string; rate: number };

export async function GET() {
  try {
    const [latest, series] = await Promise.all([
      fetchJson<FrankfurterRate>(`${FX_API}/rate/USD/THB?providers=BOT`, "latest", 6 * 60 * 60 * 1000),
      fetchJson<FrankfurterRate[]>(`${FX_API}/rates?from=2026-08-19&to=2026-09-18&base=USD&quotes=THB&providers=BOT`, "series-1m", 24 * 60 * 60 * 1000),
    ]);

    const rates = series.length ? series : [latest];
    const oldest = rates[0].rate;
    const newest = rates[rates.length - 1].rate;
    const monthAgo = rates[0].rate ?? latest.rate;
    const change1m = parseFloat((newest - monthAgo).toFixed(4));
    const changePct = parseFloat((((newest - monthAgo) / monthAgo) * 100).toFixed(2));
    const range30d = {
      low: Math.min(...rates.map((r) => r.rate)),
      high: Math.max(...rates.map((r) => r.rate)),
    };

    return NextResponse.json({
      success: true,
      billedOn: latest.date,
      rate: latest.rate,
      source: SOURCE_LABEL,
      trend: {
        change1m,
        changePct,
        direction: change1m > 0 ? "up" : change1m < 0 ? "down" : "flat",
        low30d: range30d.low,
        high30d: range30d.high,
      },
      series30d: rates,
    });
  } catch (error) {
    console.error("GET /api/fx-rate error", error);
    return NextResponse.json({ success: false, message: "Cannot fetch exchange rate" }, { status: 502 });
  }
}