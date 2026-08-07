'use client';

import { useMemo, useState } from 'react';

interface Vehicle { id: string; make: string; model: string; year: number; priceUsd: number; status: string }

export function SearchShowroom({ vehicles }: { vehicles: Vehicle[] }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => vehicles.filter((vehicle) => `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(query.toLowerCase())), [vehicles, query]);
  return <section id="showroom" className="showroom"><div className="toolbar"><div><h2>Featured vehicles</h2><p>Live demo inventory from the CarChief mock service.</p></div><label>Search vehicles <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Make or model" aria-controls="vehicle-grid" /></label></div><div id="vehicle-grid" className="vehicle-grid">{filtered.length ? filtered.map((vehicle) => <article className="vehicle-card" key={vehicle.id}><div className="vehicle-image" aria-hidden="true">{vehicle.make}</div><div className="vehicle-card-body"><span className="badge">{vehicle.status}</span><h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3><p className="price">USD {vehicle.priceUsd.toLocaleString()}</p><a className="button secondary" href={`/inventory/${vehicle.id}`}>View vehicle</a></div></article>) : <p className="empty">No vehicles match your search.</p>}</div></section>;
}
