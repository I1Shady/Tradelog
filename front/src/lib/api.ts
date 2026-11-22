
import type { Trade } from "@/types/types";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function getApiUrl(): string {
    if (!API_BASE_URL) {
        throw new Error("VITE_API_URL is not configured");
    }

    return API_BASE_URL.replace(/\/+$/, "");
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let message = `Request failed: ${response.status}`;

        try {
            const body = await response.json();

            if (body.error || body.message) {
                message = body.error || body.message;
            }
        } catch {
            // Keep the default error message.
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

// Get all trades.
export async function getTrades(): Promise<Trade[]> {
    const response = await fetch(`${getApiUrl()}/api/trades`);

    return handleResponse<Trade[]>(response);
}

// Get one trade.
export async function getTrade(id: number): Promise<Trade> {
    const response = await fetch(
        `${getApiUrl()}/api/trades/${id}`
    );

    return handleResponse<Trade>(response);
}

// Update an existing trade.
export async function updateTrade(
    id: number,
    trade: Trade
): Promise<Trade> {
    const response = await fetch(
        `${getApiUrl()}/api/trades/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(trade),
        }
    );

    return handleResponse<Trade>(response);
}
