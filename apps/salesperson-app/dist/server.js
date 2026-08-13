"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const port = Number(process.env.PORT || 3002);
const server = (0, node_http_1.createServer)((req, res) => {
    if (req.url === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', app: 'salesperson-app' }));
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CarChief | Sales & Administration Suite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-neutral-950 text-white min-h-screen">
  <header class="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-xs font-black uppercase text-red-500 tracking-wider">CARCHIEF</span>
      <span class="text-xs text-neutral-500 font-mono">/</span>
      <span class="text-xs font-bold text-white uppercase tracking-wider">Salesperson & Admin Console</span>
    </div>
    <div class="flex items-center gap-4 text-xs">
      <span class="text-neutral-400">Staff Account: <strong class="text-white">Senior Exporter</strong></span>
      <span class="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Admin Granted</span>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-10 space-y-8">
    <section class="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500">Sales Operational Suite</span>
          <h1 class="text-2xl font-extrabold uppercase text-white mt-1">Staff Backoffice & Proforma Invoicing</h1>
        </div>
        <div class="flex items-center gap-3">
          <button class="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-red-600/30">
            + Generate Proforma Invoice (PI)
          </button>
          <button class="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs uppercase px-4 py-2.5 rounded-xl border border-neutral-700">
            Export Sales Registry
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
          <span class="text-[10px] font-mono text-neutral-400 font-bold uppercase">Total Inventory</span>
          <div class="text-3xl font-black text-white font-mono">148 Units</div>
          <p class="text-[11px] text-emerald-400 font-bold">12 New Arrivals</p>
        </div>
        <div class="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
          <span class="text-[10px] font-mono text-neutral-400 font-bold uppercase">Pending PIs</span>
          <div class="text-3xl font-black text-amber-500 font-mono">8 Draft PIs</div>
          <p class="text-[11px] text-neutral-400">Total Value: $114,500</p>
        </div>
        <div class="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
          <span class="text-[10px] font-mono text-neutral-400 font-bold uppercase">Monthly Sales</span>
          <div class="text-3xl font-black text-emerald-400 font-mono">$420,800</div>
          <p class="text-[11px] text-emerald-400">+14% vs last month</p>
        </div>
        <div class="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
          <span class="text-[10px] font-mono text-neutral-400 font-bold uppercase">Exchange Rate (USD/JPY)</span>
          <div class="text-3xl font-black text-red-500 font-mono font-bold">¥154.20</div>
          <p class="text-[11px] text-neutral-400">Auto-updated</p>
        </div>
      </div>
    </section>

    <section class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white uppercase tracking-wide">Live Stock Management & PI Generation</h2>
        <input type="search" placeholder="Search chassis, make, or model..." class="bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-xs text-white placeholder-neutral-500 w-64">
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-neutral-300">
          <thead class="bg-neutral-950 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
            <tr>
              <th class="p-3">Stock ID</th>
              <th class="p-3">Chassis #</th>
              <th class="p-3">Vehicle Details</th>
              <th class="p-3">FOB Price</th>
              <th class="p-3">Est. Freight</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-800">
            <tr class="hover:bg-neutral-950/50">
              <td class="p-3 font-mono text-neutral-400">#STK-901</td>
              <td class="p-3 font-mono font-bold text-red-400">KDH201-7654321</td>
              <td class="p-3 font-bold text-white">2020 Toyota HiAce Van (3.0L Diesel)</td>
              <td class="p-3 font-mono text-white font-bold">$12,000 USD</td>
              <td class="p-3 font-mono text-neutral-400">$2,200 USD</td>
              <td class="p-3"><span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono">PI Issued</span></td>
              <td class="p-3 text-right flex justify-end gap-2">
                <button class="bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded text-[10px]">Print PI</button>
                <button class="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-2.5 py-1 rounded text-[10px]">Edit Details</button>
              </td>
            </tr>
            <tr class="hover:bg-neutral-950/50">
              <td class="p-3 font-mono text-neutral-400">#STK-902</td>
              <td class="p-3 font-mono font-bold text-red-400">NZE141-1234567</td>
              <td class="p-3 font-bold text-white">2021 Toyota Corolla Axio (1.5L Petrol)</td>
              <td class="p-3 font-mono text-white font-bold">$7,200 USD</td>
              <td class="p-3 font-mono text-neutral-400">$1,300 USD</td>
              <td class="p-3"><span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono">Available</span></td>
              <td class="p-3 text-right flex justify-end gap-2">
                <button class="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold px-2.5 py-1 rounded text-[10px]">Issue PI</button>
                <button class="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-2.5 py-1 rounded text-[10px]">Inspect</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</body>
</html>`);
});
server.listen(port, () => {
    console.log(`[salesperson-app] Salesperson & Admin Console running on port ${port}`);
});
//# sourceMappingURL=server.js.map