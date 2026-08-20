import React from 'react';
import type { CustomerVehicleStatus, CustomerVehicleSummary, CustomerVehicleDetail } from '@carchief/domain';

export type PipelineStageId = 'reserved' | 'inspection' | 'port_loading' | 'in_transit' | 'delivered';

export interface PipelineStageInfo {
  id: PipelineStageId;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export const PIPELINE_STAGES: readonly PipelineStageInfo[] = [
  {
    id: 'reserved',
    label: 'Reserved & Sourced',
    shortLabel: 'Reserved',
    description: 'Vehicle sourced and reserved under contract',
    icon: '⏱',
  },
  {
    id: 'inspection',
    label: 'Inspection & Prep',
    shortLabel: 'Inspection',
    description: 'Export inspection, mechanical check and cleaning',
    icon: '🔍',
  },
  {
    id: 'port_loading',
    label: 'Port & Loading',
    shortLabel: 'Port/Loading',
    description: 'Delivered to yard, vessel booked and containerized',
    icon: '⚓',
  },
  {
    id: 'in_transit',
    label: 'In Transit / Ocean',
    shortLabel: 'In Transit',
    description: 'Ocean freight in transit to destination port',
    icon: '🚢',
  },
  {
    id: 'delivered',
    label: 'Customs & Delivered',
    shortLabel: 'Delivered',
    description: 'Port customs clearance and final customer handover',
    icon: '🏁',
  },
] as const;

export type StatusTone = 'amber' | 'purple' | 'blue' | 'indigo' | 'green';

export interface VehiclePipelineCalculation {
  activeStepIndex: number;
  currentStage: PipelineStageInfo;
  statusTone: StatusTone;
  progressPercent: number;
  stageStates: Array<{
    stage: PipelineStageInfo;
    state: 'completed' | 'active' | 'upcoming';
  }>;
}

export function calculateVehiclePipeline(
  vehicleOrStatus: CustomerVehicleSummary | CustomerVehicleDetail | CustomerVehicleStatus | string,
  logisticsStatus?: string,
  shippingStage?: string
): VehiclePipelineCalculation {
  let statusStr = '';
  let logisticsStr = '';
  let shippingStr = '';
  let hasCommercialBill = false;
  let hasProforma = false;

  if (typeof vehicleOrStatus === 'object' && vehicleOrStatus !== null) {
    statusStr = (vehicleOrStatus.status || '').toLowerCase();
    logisticsStr = (vehicleOrStatus.logisticsStatus || '').toUpperCase();
    shippingStr = (vehicleOrStatus.shippingStage || '').toUpperCase();
    hasCommercialBill = Boolean((vehicleOrStatus as CustomerVehicleSummary).commercialBill);
    hasProforma = Boolean((vehicleOrStatus as CustomerVehicleSummary).proformaInvoiceId);
  } else {
    statusStr = (vehicleOrStatus || '').toLowerCase();
    logisticsStr = (logisticsStatus || '').toUpperCase();
    shippingStr = (shippingStage || '').toUpperCase();
  }

  let activeStepIndex = 0;
  let statusTone: StatusTone = 'amber';

  if (statusStr === 'delivered' || logisticsStr === 'DELIVERED' || shippingStr === 'DELIVERED') {
    activeStepIndex = 4;
    statusTone = 'green';
  } else if (
    statusStr === 'in transit' ||
    logisticsStr === 'IN TRANSIT' ||
    shippingStr === 'IN TRANSIT' ||
    logisticsStr === 'VESSEL DEPARTED' ||
    logisticsStr === 'ARRIVED AT PORT' ||
    logisticsStr === 'CUSTOMS CLEARANCE'
  ) {
    activeStepIndex = 3;
    statusTone = 'indigo';
  } else if (
    logisticsStr === 'READY FOR LOADING' ||
    logisticsStr === 'READY' ||
    logisticsStr === 'VESSEL BOOKED' ||
    logisticsStr === 'LOADED' ||
    shippingStr === 'PORT' ||
    shippingStr === 'LOADING'
  ) {
    activeStepIndex = 2;
    statusTone = 'blue';
  } else if (
    statusStr === 'confirmed' ||
    logisticsStr === 'INSPECTION' ||
    shippingStr === 'INSPECTION' ||
    hasCommercialBill
  ) {
    activeStepIndex = 1;
    statusTone = 'blue';
  } else if (
    statusStr === 'under negotiation with pi' ||
    hasProforma ||
    logisticsStr === 'PURCHASED'
  ) {
    activeStepIndex = 0;
    statusTone = 'purple';
  } else {
    activeStepIndex = 0;
    statusTone = 'amber';
  }

  const currentStage = PIPELINE_STAGES[activeStepIndex] || PIPELINE_STAGES[0];
  const progressPercent = Math.round(((activeStepIndex + 1) / PIPELINE_STAGES.length) * 100);

  const stageStates = PIPELINE_STAGES.map((stage, idx) => {
    let state: 'completed' | 'active' | 'upcoming' = 'upcoming';
    if (idx < activeStepIndex) {
      state = 'completed';
    } else if (idx === activeStepIndex) {
      state = 'active';
    }
    return { stage, state };
  });

  return {
    activeStepIndex,
    currentStage,
    statusTone,
    progressPercent,
    stageStates,
  };
}

export interface StatusTrackerProps {
  vehicle?: CustomerVehicleSummary | CustomerVehicleDetail | null;
  status?: CustomerVehicleStatus | string;
  logisticsStatus?: string;
  shippingStage?: string;
  variant?: 'stepper' | 'compact' | 'mini';
  className?: string;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  vehicle,
  status,
  logisticsStatus,
  shippingStage,
  variant = 'stepper',
  className = '',
}) => {
  const calculation = calculateVehiclePipeline(
    vehicle || status || 'Under Negotiation',
    logisticsStatus,
    shippingStage
  );

  const { activeStepIndex, currentStage, statusTone, progressPercent, stageStates } = calculation;

  if (variant === 'mini') {
    return (
      <div
        className={`cc-status-tracker cc-status-tracker--mini cc-status-tracker--tone-${statusTone} ${className}`}
        role="region"
        aria-label={`Status: ${currentStage.label} (${progressPercent}% completed)`}
        data-testid="status-tracker-mini"
      >
        <div className="cc-status-tracker__mini-header">
          <span className="cc-status-tracker__mini-badge">
            <span className="cc-status-tracker__mini-dot" aria-hidden="true" />
            {currentStage.shortLabel}
          </span>
          <span className="cc-status-tracker__mini-percent">{progressPercent}%</span>
        </div>
        <div className="cc-status-tracker__bar-track">
          <div
            className="cc-status-tracker__bar-fill"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`cc-status-tracker cc-status-tracker--compact cc-status-tracker--tone-${statusTone} ${className}`}
        role="region"
        aria-label={`Fulfillment progress: ${currentStage.label} (Step ${activeStepIndex + 1} of ${PIPELINE_STAGES.length})`}
        data-testid="status-tracker-compact"
      >
        <div className="cc-status-tracker__compact-row">
          <div className="cc-status-tracker__compact-info">
            <span className="cc-status-tracker__compact-step-num">Step {activeStepIndex + 1}/{PIPELINE_STAGES.length}</span>
            <span className="cc-status-tracker__compact-title">{currentStage.label}</span>
          </div>
          <span className="cc-status-tracker__compact-pct">{progressPercent}%</span>
        </div>
        <div className="cc-status-tracker__bar-track">
          <div
            className="cc-status-tracker__bar-fill"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`cc-status-tracker cc-status-tracker--stepper cc-status-tracker--tone-${statusTone} ${className}`}
      role="region"
      aria-label={`Vehicle fulfillment tracker: ${currentStage.label}`}
      data-testid="status-tracker-stepper"
    >
      <div className="cc-status-tracker__header">
        <div className="cc-status-tracker__stage-indicator">
          <span className="cc-status-tracker__pulse-dot" aria-hidden="true" />
          <span className="cc-status-tracker__current-name">{currentStage.label}</span>
        </div>
        <span className="cc-status-tracker__step-count">
          Stage {activeStepIndex + 1} of {PIPELINE_STAGES.length} ({progressPercent}%)
        </span>
      </div>

      <ol className="cc-status-tracker__stepper-list" aria-label="Fulfillment milestones">
        {stageStates.map(({ stage, state }, index) => {
          const isCompleted = state === 'completed';
          const isActive = state === 'active';

          return (
            <li
              key={stage.id}
              className={`cc-status-tracker__step cc-status-tracker__step--${state}`}
              aria-current={isActive ? 'step' : undefined}
              data-testid={`status-step-${stage.id}`}
            >
              <div className="cc-status-tracker__node-wrap">
                {index > 0 && (
                  <div
                    className={`cc-status-tracker__connector cc-status-tracker__connector--before ${
                      isCompleted || isActive ? 'cc-status-tracker__connector--filled' : ''
                    }`}
                    aria-hidden="true"
                  />
                )}
                <div className="cc-status-tracker__node" aria-hidden="true">
                  {isCompleted ? (
                    <svg
                      className="cc-status-tracker__check-icon"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="cc-status-tracker__node-num">{index + 1}</span>
                  )}
                </div>
                {index < stageStates.length - 1 && (
                  <div
                    className={`cc-status-tracker__connector cc-status-tracker__connector--after ${
                      isCompleted ? 'cc-status-tracker__connector--filled' : ''
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="cc-status-tracker__step-content">
                <span className="cc-status-tracker__step-label">{stage.shortLabel}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
