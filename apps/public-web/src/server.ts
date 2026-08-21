import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { renderLayoutShellConfig } from './shell/LayoutShell.js';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: string;
}

const port = Number(process.env.PORT || 3000);
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

function escapeHtml(value: unknown): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  return String(value).replace(/[&<>"']/g, (character) => entities[character] || character);
}

async function getVehicles(): Promise<Vehicle[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/vehicles`);
    if (!response.ok) return [];
    const result = await response.json() as { items?: Vehicle[] };
    return result.items || [];
  } catch {
    return [];
  }
}

export function renderPublicPage(vehicles: Vehicle[]): string {
  const shell = renderLayoutShellConfig({ activePath: '/' });
  const cards = vehicles.map((vehicle) => `
    <article class="vehicle-card" data-vehicle="${escapeHtml(`${vehicle.make} ${vehicle.model}`.toLowerCase())}">
      <div class="vehicle-image" aria-hidden="true">${escapeHtml(vehicle.make)}</div>
      <div class="vehicle-card-body">
        <span class="badge">${escapeHtml(vehicle.status)}</span>
        <h3>${escapeHtml(vehicle.year)} ${escapeHtml(vehicle.make)} ${escapeHtml(vehicle.model)}</h3>
        <p class="price">USD ${escapeHtml(vehicle.priceUsd.toLocaleString())}</p>
        <a class="button secondary" href="/inventory/${escapeHtml(vehicle.id)}">View vehicle</a>
      </div>
    </article>`).join('');
  const nav = shell.landmarks.header.navItems.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>CarChief | Japanese Used Vehicles</title><meta name="description" content="Find quality Japanese used vehicles with CarChief.">
<link rel="manifest" href="/manifest.webmanifest"><style>
:root{font-family:Inter,system-ui,sans-serif;color:#172033;background:#f7f9fc}*{box-sizing:border-box}body{margin:0}header{background:#102a43;color:#fff}header>div,main,footer{max-width:1120px;margin:auto;padding:1rem 1.25rem}header>div{display:flex;align-items:center;justify-content:space-between;gap:1rem}nav{display:flex;gap:1rem;flex-wrap:wrap}nav a{color:#fff;text-decoration:none}.hero{padding:4rem 1.25rem;background:linear-gradient(120deg,#102a43,#1976a8);color:#fff}.hero-inner{max-width:1120px;margin:auto}.hero h1{font-size:clamp(2rem,5vw,4rem);max-width:700px;margin:.5rem 0}.hero p{font-size:1.15rem;max-width:650px}.button{display:inline-block;border:0;border-radius:.5rem;padding:.7rem 1rem;text-decoration:none;font-weight:700;cursor:pointer}.primary{background:#ffb703;color:#172033}.secondary{background:#e8f1f7;color:#102a43}.showroom{padding-top:2.5rem}.toolbar{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}.toolbar input{min-width:240px;padding:.75rem;border:1px solid #b7c8d6;border-radius:.5rem}.vehicle-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin:1.5rem 0 3rem}.vehicle-card{background:#fff;border:1px solid #d8e2ea;border-radius:.75rem;overflow:hidden;box-shadow:0 4px 16px #102a4312}.vehicle-image{height:130px;background:#dcecf4;display:grid;place-items:center;color:#1976a8;font-weight:800;font-size:1.4rem}.vehicle-card-body{padding:1rem}.vehicle-card h3{margin:.7rem 0}.price{font-weight:800;font-size:1.15rem}.badge{display:inline-block;background:#e1f5e9;color:#176b3a;padding:.2rem .5rem;border-radius:999px;font-size:.8rem}.empty{padding:1rem;background:#fff;border:1px dashed #9bb1c1;border-radius:.5rem}footer{color:#506579;padding-top:2rem;padding-bottom:2rem}@media(max-width:640px){header>div{align-items:flex-start;flex-direction:column}.hero{padding:3rem 1.25rem}.toolbar{align-items:stretch;flex-direction:column}.toolbar input{min-width:0;width:100%}}
</style></head><body>
<header><div><strong>CarChief</strong><nav aria-label="Main navigation">${nav}</nav></div></header>
<main id="main-content"><section class="hero"><div class="hero-inner"><p>Japanese vehicles, made simple.</p><h1>Find your next vehicle with confidence.</h1><p>Browse our current stock and connect with the CarChief team for a quotation.</p><a class="button primary" href="#showroom">Browse stock</a></div></section>
<section id="showroom" class="showroom"><div class="toolbar"><div><h2>Featured vehicles</h2><p>Live inventory from the CarChief mock service.</p></div><label>Search vehicles <input id="vehicle-search" type="search" placeholder="Make or model" aria-controls="vehicle-grid"></label></div>
<div id="vehicle-grid" class="vehicle-grid">${cards || '<p class="empty">No vehicles are available right now.</p>'}</div></section></main>
<footer><small>© CarChief. Public website.</small></footer>
<script>const input=document.querySelector('#vehicle-search');input?.addEventListener('input',()=>{const q=input.value.toLowerCase();document.querySelectorAll('.vehicle-card').forEach(c=>{c.hidden=!c.dataset.vehicle.includes(q)})});</script>
</body></html>`;
}

function send(response: ServerResponse, status: number, type: string, body: string): void {
  response.writeHead(status, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' });
  response.end(body);
}

async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const pathname = new URL(request.url || '/', 'http://localhost').pathname;
  if (pathname === '/healthz') return send(response, 200, 'application/json', JSON.stringify({ status: 'ok' }));
  if (pathname === '/manifest.webmanifest') return send(response, 200, 'application/manifest+json', JSON.stringify({ name: 'CarChief', short_name: 'CarChief', start_url: '/', display: 'standalone', theme_color: '#102a43' }));
  if (pathname === '/sw.js') return send(response, 200, 'application/javascript', "self.addEventListener('install',()=>self.skipWaiting());");
  if (pathname.startsWith('/api/')) {
    const upstream = await fetch(`${apiBaseUrl}${pathname}`);
    return send(response, upstream.status, 'application/json', await upstream.text());
  }
  return send(response, 200, 'text/html', renderPublicPage(await getVehicles()));
}

if (process.env.NODE_ENV !== 'test') createServer((request, response) => void handler(request, response)).listen(port, () => console.log(`CarChief public web listening on ${port}`));
