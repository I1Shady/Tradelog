import type { Trade } from "@/types/types";

const API_BASE_URL = String(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
function getApiUrl() {
  if (!API_BASE_URL) throw new Error("VITE_API_URL is not configured");
  return API_BASE_URL;
}
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try { const body = await response.json(); if (body.error || body.message) message = body.error || body.message; } catch { /* use fallback */ }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}
const requestHeaders = { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" };

export async function getTrades(): Promise<Trade[]> {
  return handleResponse(await fetch(`${getApiUrl()}/api/trades`, { credentials: "include" }));
}
export async function getTrade(id: number): Promise<Trade> {
  return handleResponse(await fetch(`${getApiUrl()}/api/trades/${id}`, { credentials: "include" }));
}
export async function updateTrade(id: number, trade: Trade): Promise<Trade> {
  return handleResponse(await fetch(`${getApiUrl()}/api/trades/${id}`, {
    method: "PUT", credentials: "include", headers: requestHeaders, body: JSON.stringify(trade),
  }));
}
