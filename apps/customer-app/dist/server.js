"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const port = Number(process.env.PORT || 3001);
const server = (0, node_http_1.createServer)((req, res) => {
    if (req.url === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', app: 'customer-app' }));
        return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CarChief | Customer Workspace & Orders</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-neutral-950 text-white min-h-screen">
  <header class="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-xs font-black uppercase text-amber-500 tracking-wider">CARCHIEF</span>
      <span class="text-xs text-neutral-500 font-mono">/</span>
      <span class="text-xs font-bold text-white uppercase tracking-wider">Customer Portal</span>
    </div>
    <div class="flex items-center gap-4 text-xs">
      <span class="text-neutral-400">Welcome, <strong class="text-white">Importers Ltd</strong></span>
      <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">Verified Importer</span>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-6 py-10 space-y-8">
    <section class="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500">Customer Dashboard</span>
          <h1 class="text-2xl font-extrabold uppercase text-white mt-1">My Orders & Reserved Vehicles</h1>
        </div>
        <div class="flex items-center gap-3">
          <button class="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition-colors">
            + Request Proforma Invoice
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
          <span class="text-[10px] font-mono text-neutral-400 font-bold uppercase">Active Vehicle Holds</span>
          <div class="text-3xl font-black text-white font-mono">2 Vehicles</div>
          <p class="text-[11px] text-amber-400 font-medium">1 Hold expiring in 23h 45m</p>
        </div>
        <div class="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
          <span class="text-[10px] font-mono text-neutral-400 font-bold uppercase">Proforma Invoices (PI)</span>
          <div class="text-3xl font-black text-amber-500 font-mono">$22,700.00</div>
          <p class="text-[11px] text-neutral-400">PI #PI-2026-8801 Pending TT</p>
        </div>
        <div class="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-2">
          <span class="text-[10px] font-mono text-neutral-400 font-bold uppercase">In Transit Cargo</span>
          <div class="text-3xl font-black text-emerald-400 font-mono">1 Shipments</div>
          <p class="text-[11px] text-neutral-400">Vessel: HOEGH AUTOLINERS</p>
        </div>
      </div>
    </section>

    <section class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
      <h2 class="text-lg font-bold text-white uppercase tracking-wide">Reserved Inventory & TT Tracking</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-neutral-300">
          <thead class="bg-neutral-950 text-neutral-400 font-mono text-[10px] uppercase border-b border-neutral-800">
            <tr>
              <th class="p-3">Chassis #</th>
              <th class="p-3">Vehicle Description</th>
              <th class="p-3">Total C&F Price</th>
              <th class="p-3">PI Status</th>
              <th class="p-3">Payment Status</th>
              <th class="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-800">
            <tr class="hover:bg-neutral-950/50">
              <td class="p-3 font-mono font-bold text-amber-400">KDH201-7654321</td>
              <td class="p-3 font-bold text-white">2020 Toyota HiAce Van</td>
              <td class="p-3 font-mono text-white font-bold">$14,200 USD</td>
              <td class="p-3"><span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-mono">PI Issued</span></td>
              <td class="p-3"><span class="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[10px]">Awaiting TT Transfer</span></td>
              <td class="p-3 text-right"><button class="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1 rounded text-[10px]">Upload TT Receipt</button></td>
            </tr>
            <tr class="hover:bg-neutral-950/50">
              <td class="p-3 font-mono font-bold text-amber-400">NZE141-1234567</td>
              <td class="p-3 font-bold text-white">2021 Toyota Corolla Axio</td>
              <td class="p-3 font-mono text-white font-bold">$8,500 USD</td>
              <td class="p-3"><span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono">Confirmed</span></td>
              <td class="p-3"><span class="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">100% Paid</span></td>
              <td class="p-3 text-right"><button class="bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-3 py-1 rounded text-[10px]">Track Vessel</button></td>
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
    console.log(`[customer-app] Customer Portal running on port ${port}`);
});
//# sourceMappingURL=server.js.map