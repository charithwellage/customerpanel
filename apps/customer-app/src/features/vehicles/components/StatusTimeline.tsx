import React from 'react';
import type { CustomerVehicleStatusHistoryItem } from '@carchief/domain';

export interface StatusTimelineProps {
  history: CustomerVehicleStatusHistoryItem[];
  currentStatus?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="cc-cust-fleet-timeline cc-cust-fleet-timeline--empty">
        <p>No transaction history recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="cc-cust-fleet-timeline" aria-label="Transaction Status Timeline">
      <h3 className="cc-cust-fleet-section-title">Transaction Milestones</h3>
      <ol className="cc-cust-fleet-timeline__list">
        {history.map((item, index) => {
          const isLatest = index === history.length - 1;
          const statusSlug = item.status.toLowerCase().replace(/\s+/g, '-');
          return (
            <li
              key={`${item.status}-${item.timestamp}-${index}`}
              className={`cc-cust-fleet-timeline__item cc-cust-fleet-timeline__item--${statusSlug} ${isLatest ? 'cc-cust-fleet-timeline__item--active' : ''}`}
            >
              <div className="cc-cust-fleet-timeline__bullet" aria-hidden="true" />
              <div className="cc-cust-fleet-timeline__content">
                <div className="cc-cust-fleet-timeline__header">
                  <span className="cc-cust-fleet-timeline__status">{item.status}</span>
                  <time className="cc-cust-fleet-timeline__time" dateTime={item.timestamp}>
                    {new Date(item.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>
                {item.notes && <p className="cc-cust-fleet-timeline__notes">{item.notes}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
