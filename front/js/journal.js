import { initTheme } from "./theme.js";
import { initNavbar } from "./components/navbar.js";


// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNavbar();
    setupEventListeners();
    fetchTrades();
});


// ============================================================
// STATE
// ============================================================

const API_URL = "http://localhost:5000/api/trades";

let trades = [];
let filteredTrades = [];
let currentPage = 1;
let pageSize = 10;
let currentFilter = "all";
let searchQuery = "";


// ============================================================
// FETCH TRADES FROM API
// ============================================================

async function fetchTrades() {

    const tbody = document.getElementById("tradeTableBody");

    // Loading state
    tbody.innerHTML = `
        <tr>
            <td colspan="27" class="table-loading">
                Loading trades...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        trades = await response.json();

        filteredTrades = [...trades];

        updateStats();
        applyFilters();

    } catch (error) {

        console.error("❌ Failed to fetch trades:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="27" class="table-empty">
                    ⚠️ Failed to load trades. Is the backend running?
                </td>
            </tr>
        `;
    }
}


// ============================================================
// STATS
// ============================================================

function updateStats() {

    const total = trades.length;

    const closedTrades = trades.filter(
        trade => trade.status === "closed"
    );

    const wins = closedTrades.filter(
        trade => (trade.pnl || 0) > 0
    );

    const totalPnl = closedTrades.reduce(
        (sum, trade) => sum + (trade.pnl || 0),
        0
    );

    const winRate = closedTrades.length > 0
        ? Math.round((wins.length / closedTrades.length) * 100)
        : 0;

    const today = new Date().toDateString();

    const todayTrades = trades.filter(
        trade => new Date(trade.date).toDateString() === today
    );

    const todayPnl = todayTrades.reduce(
        (sum, trade) => sum + (trade.pnl || 0),
        0
    );

    document.getElementById("balance").textContent =
        `$${(1000 + totalPnl).toFixed(2)}`;

    const todayPnlElement = document.getElementById("todayPnl");

    todayPnlElement.textContent =
        `${todayPnl >= 0 ? "+" : "-"}$${Math.abs(todayPnl).toFixed(2)}`;

    todayPnlElement.className =
        `stat-value ${todayPnl >= 0 ? "positive" : "negative"}`;

    document.getElementById("winRate").textContent = `${winRate}%`;

    document.getElementById("totalTrades").textContent = total;
}


// ============================================================
// RENDER TABLE
// ============================================================

function renderTable() {

    const tbody = document.getElementById("tradeTableBody");

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    const pageData = filteredTrades.slice(start, end);

    if (pageData.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="27" class="table-empty">
                    No trades found
                </td>
            </tr>
        `;

        renderPagination();
        return;
    }

    tbody.innerHTML = pageData
        .map(trade => createTradeRow(trade))
        .join("");

    renderPagination();
}


// ============================================================
// CREATE ROW
// ============================================================

function createTradeRow(trade) {

    const date = new Date(trade.date);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const day = dayNames[date.getDay()];
    const dayNumber = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const pnl = trade.pnl !== null && trade.pnl !== undefined
        ? trade.pnl
        : null;

    const pnlClass = pnl === null
        ? "pending"
        : pnl >= 0
            ? "positive"
            : "negative";

    const pnlText = pnl === null
        ? "Pending"
        : `${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl).toFixed(2)}`;

    const checkHtml = createCheckHtml(trade.checkItems);

    const entryShot = trade.entryScreenshot
        ? `<button class="entry-shot" type="button" title="View entry screenshot">↗</button>`
        : `<span class="entry-shot empty">—</span>`;

    const exitShot = trade.exitScreenshot
        ? `<button class="entry-shot" type="button" title="View exit screenshot">↗</button>`
        : `<span class="entry-shot empty">—</span>`;

    return `

        <tr>

            <!-- ============ TRADE ============ -->

            <td class="col-num row-number">${trade.id}</td>

            <td class="col-day">
                <span class="date-day">${day}</span>
            </td>

            <td class="col-d muted-cell">${dayNumber}</td>
            <td class="col-m muted-cell">${month}</td>
            <td class="col-year muted-cell">${year}</td>
            <td class="col-hh muted-cell">${hours}</td>
            <td class="col-mm muted-cell">${minutes}</td>

            <td class="col-symbol symbol-cell">
                ${escapeHtml(trade.symbol)}
            </td>

            <td class="col-exchange muted-cell">
                ${escapeHtml(trade.exchange)}
            </td>

            <td class="col-tf">
                <span class="tf-badge">${escapeHtml(trade.timeframe)}</span>
            </td>

            <td class="col-side">
                <span class="badge ${trade.side.toLowerCase()}">
                    ${trade.side}
                </span>
            </td>

            <td class="col-entry numeric-cell">
                $${formatNumber(trade.entryPrice)}
            </td>

            <td class="col-margin numeric-cell muted-cell">
                $${formatNumber(trade.positionMargin)}
            </td>

            <td class="col-lev">
                <span class="lev-badge">${trade.leverage}x</span>
            </td>

            <td class="col-ordervalue numeric-cell">
                $${formatNumber(trade.orderValue)}
            </td>

            <td class="col-ordertype muted-cell">
                ${escapeHtml(trade.orderType)}
            </td>

            <td class="col-entsshot">
                ${entryShot}
            </td>


            <!-- ============ ANALYSIS ============ -->

            <td class="col-mental truncate-cell"
                title="${escapeHtml(trade.mentalState)}">
                ${escapeHtml(trade.mentalState)}
            </td>

            <td class="col-strategy truncate-cell"
                title="${escapeHtml(trade.strategy)}">
                ${escapeHtml(trade.strategy)}
            </td>

            <td class="col-mistakes truncate-cell muted-cell"
                title="${escapeHtml(trade.mistakes)}">
                ${escapeHtml(trade.mistakes)}
            </td>

            <td class="col-check">
                ${checkHtml}
            </td>

            <td class="col-analysis truncate-cell muted-cell"
                title="${escapeHtml(trade.notes || "-")}">
                ${escapeHtml(trade.notes || "-")}
            </td>


            <!-- ============ RISK / RESULT ============ -->

            <td class="col-sl numeric-cell">
                ${formatPrice(trade.stopLoss)}
            </td>

            <td class="col-tp numeric-cell">
                ${formatPrice(trade.takeProfit)}
            </td>

            <td class="col-exitshot">
                ${exitShot}
            </td>

            <td class="col-posacc numeric-cell">
                ${trade.positionToAcc.toFixed(2)}%
            </td>

            <td class="col-pnl ${pnlClass}">
                <span class="pnl-value">${pnlText}</span>
                ${
                    trade.status === "closed"
                        ? `<span class="pnl-status">${trade.exitType || "CLOSED"}</span>`
                        : `<span class="pnl-status">OPEN</span>`
                }
            </td>

        </tr>

    `;
}


// ============================================================
// CHECK ITEMS
// ============================================================

function createCheckHtml(checks = {}) {

    const items = [
        { key: "volume", label: "V" },
        { key: "time",   label: "T" },
        { key: "trend",  label: "TR" },
        { key: "btc",    label: "B" }
    ];

    return `
        <div class="check-list">
            ${items.map(item => `
                <span
                    class="check-item ${checks[item.key] ? "checked" : ""}"
                    title="${item.label}"
                >
                    ${checks[item.key] ? "✓" : "—"}
                </span>
            `).join("")}
        </div>
    `;
}


// ============================================================
// FILTERS
// ============================================================

function applyFilters() {

    let result = [...trades];

    if (currentFilter === "long") {
        result = result.filter(trade => trade.side === "LONG");
    }
    else if (currentFilter === "short") {
        result = result.filter(trade => trade.side === "SHORT");
    }
    else if (currentFilter === "win") {
        result = result.filter(trade => (trade.pnl || 0) > 0);
    }
    else if (currentFilter === "loss") {
        result = result.filter(trade => (trade.pnl || 0) < 0);
    }

    if (searchQuery.trim()) {

        const query = searchQuery.toLowerCase().trim();

        result = result.filter(trade =>
            trade.symbol.toLowerCase().includes(query) ||
            trade.strategy.toLowerCase().includes(query) ||
            trade.exchange.toLowerCase().includes(query) ||
            trade.mentalState.toLowerCase().includes(query)
        );
    }

    filteredTrades = result;
    currentPage = 1;
    renderTable();
}


// ============================================================
// PAGINATION
// ============================================================

function renderPagination() {

    const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    document.getElementById("pageCurrent").textContent = currentPage;
    document.getElementById("prevPage").disabled = currentPage <= 1;
    document.getElementById("nextPage").disabled = currentPage >= totalPages;
}


// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {

    document.querySelectorAll(".filter-btn").forEach(button => {

        button.addEventListener("click", () => {

            document.querySelectorAll(".filter-btn").forEach(btn =>
                btn.classList.remove("active")
            );

            button.classList.add("active");

            currentFilter = button.dataset.filter;

            applyFilters();
        });
    });

    document.getElementById("searchInput").addEventListener(
        "input",
        event => {
            searchQuery = event.target.value;
            applyFilters();
        }
    );

    document.getElementById("prevPage").addEventListener(
        "click",
        () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        }
    );

    document.getElementById("nextPage").addEventListener(
        "click",
        () => {
            const totalPages = Math.ceil(filteredTrades.length / pageSize);

            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        }
    );

    document.getElementById("pageSize").addEventListener(
        "change",
        event => {
            pageSize = parseInt(event.target.value, 10);
            currentPage = 1;
            renderTable();
        }
    );
}


// ============================================================
// FORMATTERS
// ============================================================

function formatNumber(value) {

    if (value === null || value === undefined) {
        return "-";
    }

    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatPrice(value) {

    if (value === null || value === undefined) {
        return "-";
    }

    return `$${formatNumber(value)}`;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}