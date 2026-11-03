import type { Trade } from "@/types/types";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function getTrades(): Promise<Trade[]> {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/api/trades`);

  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.status}`);
  }

  return response.json();
}