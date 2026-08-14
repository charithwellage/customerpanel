import React from 'react';
import { useCustomerShell } from '../shell/index.js';
import { useShipments } from './useShipments.js';

const stageLabels = ['Purchased', 'Inspection', 'Ready', 'In Transit', 'Delivered'] as const;

export const ShipmentPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const { data: shipments, isLoading, error, refetch } = useShipments();

  React.useEffect(() => {
    setActiveRoute('/shipments');
  }, [setActiveRoute]);

  return (
    <section className="cc-cust-shipments" aria-labelledby="shipments-title">
      <header className="cc-cust-shipments__header">
        <div>
          <p className="cc-cust-shipments__eyebrow">Logistics</p>
          <h1 id="shipments-title" className="cc-cust-shipments__title">Shipment tracking</h1>
          <p className="cc-cust-shipments__subtitle">Follow the latest confirmed stage for each customer-owned vehicle.</p>
        </div>
        <span className="cc-cust-shipments__boundary">Manual/external tracking updates are shown honestly.</span>
      </header>

      {isLoading && <p className="cc-cust-shipments__state" role="status" aria-live="polite">Loading shipment history…</p>}

      {error && (
        <div className="cc-cust-shipments__state cc-cust-shipments__state--error" role="alert">
          <p>Shipment history is temporarily unavailable.</p>
          <button type="button" className="cc-cust-shipments__retry" onClick={() => void refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && shipments?.length === 0 && (
        <p className="cc-cust-shipments__state" role="status">No shipment records are available yet.</p>
      )}

      {shipments && shipments.length > 0 && (
        <div className="cc-cust-shipments__list" aria-label="Customer shipments">
          {shipments.map((shipment) => {
            const currentIndex = stageLabels.indexOf(shipment.stage);
            return (
              <article className="cc-cust-shipment-card" key={shipment.id}>
                <div className="cc-cust-shipment-card__heading">
                  <div>
                    <p className="cc-cust-shipment-card__label">Vehicle</p>
                    <h2 className="cc-cust-shipment-card__title">{shipment.vehicleId}</h2>
                  </div>
                  <span className={`cc-cust-shipment-card__freshness cc-cust-shipment-card__freshness--${shipment.freshness}`}>
                    {shipment.freshness === 'unknown' ? 'Status unknown' : shipment.freshness === 'stale' ? 'Update may be delayed' : 'Latest update'}
                  </span>
                </div>

                <p className="cc-cust-shipment-card__stage">Current stage: <strong>{shipment.stage}</strong></p>
                <dl className="cc-cust-shipment-card__approvals">
                  <dt>Ship OK</dt><dd>{shipment.shipOkStatus}</dd>
                  <dt>Document release</dt><dd>{shipment.documentReleaseStatus}</dd>
                </dl>
                {(shipment.shipOkRejectionReason || shipment.documentReleaseRejectionReason) && (
                  <aside className="cc-cust-shipment-card__notice" aria-label="Operations update">
                    <strong>Operations update</strong>
                    {shipment.shipOkRejectionReason && <p>Ship OK: {shipment.shipOkRejectionReason}</p>}
                    {shipment.documentReleaseRejectionReason && <p>Document release: {shipment.documentReleaseRejectionReason}</p>}
                    <p>Resubmission is handled by the operations team; customers cannot approve or resubmit these checkpoints.</p>
                  </aside>
                )}
                <ol className="cc-cust-shipment-card__timeline" aria-label={`Shipment stages for ${shipment.vehicleId}`}>
                  {stageLabels.map((stage, index) => (
                    <li className={`cc-cust-shipment-card__step ${index < currentIndex ? 'cc-cust-shipment-card__step--complete' : ''} ${index === currentIndex ? 'cc-cust-shipment-card__step--current' : ''}`} key={stage}>
                      <span className="cc-cust-shipment-card__step-marker" aria-hidden="true" />
                      <span>{stage}</span>
                    </li>
                  ))}
                </ol>

                <dl className="cc-cust-shipment-card__details">
                  {shipment.location && <><dt>Last reported location</dt><dd>{shipment.location}</dd></>}
                  {shipment.eta && <><dt>Estimated arrival</dt><dd><time dateTime={shipment.eta}>{new Date(shipment.eta).toLocaleDateString()}</time></dd></>}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
