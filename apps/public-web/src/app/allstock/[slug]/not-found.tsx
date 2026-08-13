/**
 * Rendered with a real HTTP 404 when a vehicle slug does not resolve, so a
 * missing vehicle is never presented as a successful page (PUB-11, RULE-10).
 */
export default function VehicleNotFound() {
  return (
    <section className="cc-vehicle-detail__not-found">
      <p role="alert" className="cc-vehicle-detail__not-found-text">
        Vehicle not found.
      </p>
      <a href="/allstock" className="cc-vehicle-detail__back-link">
        Browse all vehicles
      </a>
    </section>
  );
}
