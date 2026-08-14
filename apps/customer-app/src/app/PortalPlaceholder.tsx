import React from 'react';
import { useCustomerShell } from '../features/shell/index.js';
import { CUSTOMER_FEATURE_REGISTRY } from '../features/registry/index.js';

export interface PortalPlaceholderProps {
  /** Email from the active session, shown so the signed-in identity is unambiguous. */
  signedInAs: string;
}

/**
 * Honest stand-in for the authenticated portal body.
 *
 * Phase 2.1 delivers account access and the application shell only; dashboard,
 * inventory, vehicle, invoice, payment, shipment and document content belong to
 * Phases 2.2-2.8. This surface therefore states that the selected section is not
 * built yet instead of rendering placeholder KPIs, balances or vehicle rows,
 * which would reproduce the fabricated-figures defect that
 * `tasks/TASK_EXECUTION_PROTOCOL.md` §7 prohibits.
 */
export const PortalPlaceholder: React.FC<PortalPlaceholderProps> = ({ signedInAs }) => {
  const { activeRoute } = useCustomerShell();
  const record = Object.values(CUSTOMER_FEATURE_REGISTRY).find((entry) => entry.routePath === activeRoute);

  return (
    <section className="cc-cust-placeholder" aria-label="Section availability">
      <p className="cc-cust-placeholder__badge">NOT BUILT YET</p>
      <h2 className="cc-cust-placeholder__title">
        {record ? `${record.title} is not available yet` : 'This section is not available yet'}
      </h2>
      <p className="cc-cust-placeholder__body">
        You are signed in as <strong>{signedInAs}</strong>. This build delivers customer account access and the
        application shell only.
      </p>
      <p className="cc-cust-placeholder__body">
        {record
          ? `${record.title} is scheduled for ${record.phase}. No data is shown here because none has been implemented.`
          : 'No data is shown here because none has been implemented for this route.'}
      </p>
    </section>
  );
};
