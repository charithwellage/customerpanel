import React, { useState } from 'react';
import type { CustomerVehicleDocumentReference } from '@carchief/domain';

export interface ExportDocumentsCardProps {
  documents: CustomerVehicleDocumentReference[];
}

export const ExportDocumentsCard: React.FC<ExportDocumentsCardProps> = ({ documents }) => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleDownload = (doc: CustomerVehicleDocumentReference) => {
    if (doc.status !== 'Available') return;
    setDownloadNotice(`Downloading ${doc.title}...`);
    setTimeout(() => {
      setDownloadNotice(null);
    }, 3000);
  };

  return (
    <div className="cc-cust-fleet-card cc-cust-fleet-docs-card" aria-label="Export and Clearance Documentation">
      <h3 className="cc-cust-fleet-section-title">Export & Clearance Documents</h3>

      {downloadNotice && (
        <div className="cc-cust-fleet-notice" role="status" aria-live="polite">
          <p>{downloadNotice}</p>
        </div>
      )}

      {documents.length === 0 ? (
        <p className="cc-cust-fleet-docs-card__empty">No export documents generated yet.</p>
      ) : (
        <ul className="cc-cust-fleet-docs-list">
          {documents.map((doc) => {
            const isAvailable = doc.status === 'Available';
            const statusClass = `cc-cust-fleet-doc-badge--${doc.status.toLowerCase()}`;
            return (
              <li key={doc.id} className="cc-cust-fleet-docs-list__item">
                <div className="cc-cust-fleet-docs-list__info">
                  <span className="cc-cust-fleet-docs-list__icon" aria-hidden="true">📄</span>
                  <div>
                    <h4 className="cc-cust-fleet-docs-list__title">{doc.title}</h4>
                    {doc.issuedAt && (
                      <span className="cc-cust-fleet-docs-list__date">
                        Issued: {new Date(doc.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="cc-cust-fleet-docs-list__actions">
                  <span className={`cc-cust-fleet-doc-badge ${statusClass}`}>{doc.status}</span>
                  {isAvailable && (
                    <button
                      type="button"
                      className="cc-cust-fleet-btn cc-cust-fleet-btn--secondary cc-cust-fleet-btn--small"
                      onClick={() => handleDownload(doc)}
                      aria-label={`Download ${doc.title}`}
                    >
                      Download
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
