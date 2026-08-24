import React from 'react';
import './customer-vehicle-specifications.css';

type SpecificationVehicle = {
  make: string;
  model: string;
  chassisNumber: string;
  year: number;
  stockNumber?: string;
  stockType?: 'J' | 'CRFO';
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  mileage?: number;
  engineSize?: string;
  color?: string;
  modelCode?: string;
  versionClass?: string;
  registerYear?: string;
  mfgYear?: string;
  steering?: string;
  seats?: number;
  loadCapacity?: number;
  doors?: number;
  grossWeight?: number;
  dimensions?: {
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
    m3?: number;
  };
};

interface CustomerVehicleSpecificationsProps {
  vehicle: SpecificationVehicle;
}

const valueOrDash = (value: string | number | undefined): string => {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
};

const formatMileage = (value: number | undefined): string => (
  value === undefined ? '—' : `${value.toLocaleString()} km`
);

const formatWeight = (value: number | undefined): string => (
  value === undefined ? '—' : `${value.toLocaleString()} kg`
);

export const CustomerVehicleSpecifications: React.FC<CustomerVehicleSpecificationsProps> = ({ vehicle }) => {
  const engine = vehicle.engineSize;
  const mileage = formatMileage(vehicle.mileage);
  const fuel = vehicle.fuelType;
  const transmission = vehicle.transmission;
  const color = vehicle.color;

  const quickSpecifications = [
    { icon: '⚙', value: engine },
    { icon: '◉', value: mileage },
    { icon: '⛽', value: fuel },
    { icon: '⚙', value: transmission },
    { icon: '●', value: color },
  ];

  const rows: Array<[string, string | number | undefined, string, string | number | undefined]> = [
    ['Stock No.', vehicle.stockNumber, 'Make', vehicle.make],
    ['Model', vehicle.model, 'Model Code', vehicle.modelCode],
    ['Chassis No', vehicle.chassisNumber, 'Version/Class', vehicle.versionClass],
    ['REG Year/Mon', vehicle.registerYear, 'MFG Year/Mon', vehicle.mfgYear || vehicle.year],
    ['Mileage', mileage, 'Fuel', fuel],
    ['Transmission', transmission, 'Engine', engine],
    ['2WD/4WD', vehicle.driveTrain, 'Exterior Color', color],
    ['Doors', vehicle.doors, 'Steering', vehicle.steering],
    ['Seats', vehicle.seats, 'Gross Weight', formatWeight(vehicle.grossWeight)],
    ['LxWxH', vehicle.dimensions
      ? [vehicle.dimensions.lengthMm, vehicle.dimensions.widthMm, vehicle.dimensions.heightMm].every((part) => part !== undefined)
        ? `${vehicle.dimensions.lengthMm} x ${vehicle.dimensions.widthMm} x ${vehicle.dimensions.heightMm} mm`
        : undefined
      : undefined, 'M3 Size', vehicle.dimensions?.m3 === undefined ? undefined : `${vehicle.dimensions.m3} m³`],
    ['Type', vehicle.bodyStyle, '', undefined],
  ];

  return (
    <section className="cc-customer-specifications" aria-labelledby="customer-specifications-heading">
      <h2 id="customer-specifications-heading" className="cc-customer-specifications__heading">Specifications</h2>

      <div className="cc-customer-specifications__quick-grid" aria-label="Key vehicle specifications">
        {quickSpecifications.map((spec, index) => (
          <div className="cc-customer-specifications__quick-item" key={`${spec.icon}-${index}`}>
            <span className="cc-customer-specifications__quick-icon" aria-hidden="true">{spec.icon}</span>
            <strong>{valueOrDash(spec.value).toUpperCase()}</strong>
          </div>
        ))}
      </div>

      <div className="cc-customer-specifications__table-wrap">
        <table className="cc-customer-specifications__table">
          <tbody>
            {rows.map(([labelA, valueA, labelB, valueB]) => (
              <tr key={`${labelA}-${labelB}`}>
                <th scope="row">{labelA}</th>
                <td>{valueOrDash(valueA)}</td>
                <th scope="row">{labelB}</th>
                <td>{valueOrDash(valueB)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
