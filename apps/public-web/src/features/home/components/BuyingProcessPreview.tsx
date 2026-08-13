import React from 'react';

export const BuyingProcessPreview: React.FC = () => {
  const steps = [
    { step: '01', title: 'Select Vehicle & Get Quote', desc: 'Browse available stock and request a quotation for your destination port.' },
    { step: '02', title: 'Confirm Proforma Invoice', desc: 'Review pricing breakdown and confirm payment terms with bank wire instructions.' },
    { step: '03', title: 'Complete Bank Transfer', desc: 'Transfer funds securely and provide swift confirmation to our billing department.' },
    { step: '04', title: 'Maritime Vessel Shipping', desc: 'Vehicle is loaded onto ocean carrier and shipping title documents dispatched.' },
    { step: '05', title: 'Port Delivery & Clearance', desc: 'Receive vehicle at your local port, settle customs clearance, and take delivery.' },
  ];

  return (
    <section aria-labelledby="buying-process-title" className="home-section">
      <div className="home-section-header">
        <span className="home-section-eyebrow">Sourcing Guide</span>
        <h2 id="buying-process-title" className="home-section-title">
          CarChief 5-Step Sourcing Process
        </h2>
      </div>

      <div className="buying-process-grid">
        {steps.map((item) => (
          <div key={item.step} className="buying-process-card">
            <span className="buying-process-step">{item.step}</span>
            <h3 className="buying-process-card-title">{item.title}</h3>
            <p className="buying-process-card-desc">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
