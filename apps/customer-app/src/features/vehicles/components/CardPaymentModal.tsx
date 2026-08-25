import React, { useMemo, useState } from 'react';
import type { CustomerVehicleDetail, CreateCustomerCardPaymentRequest } from '@carchief/domain';

interface Props {
  vehicle: CustomerVehicleDetail;
  isOpen: boolean;
  isSubmitting: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (request: CreateCustomerCardPaymentRequest) => void;
}

export const CardPaymentModal: React.FC<Props> = ({ vehicle, isOpen, isSubmitting, error, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const balance = vehicle.cardPaymentEligibility?.outstandingAmountUsd ?? vehicle.balanceAmountUsd;
  const cardBrand = useMemo(() => /^4/.test(cardNumber.replace(/\s/g, '')) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(cardNumber.replace(/\s/g, '')) ? 'Mastercard' : '', [cardNumber]);
  if (!isOpen) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > balance) return setValidationError(`Enter an amount between 0.01 and ${balance.toLocaleString()} USD.`);
    if (!cardholderName.trim() || cardNumber.replace(/\s/g, '').length < 13 || !/^\d{1,2}$/.test(expiryMonth) || !/^\d{4}$/.test(expiryYear) || !/^\d{3,4}$/.test(cvv)) return setValidationError('Complete the card details with valid values.');
    setValidationError(null);
    onSubmit({ vehicleId: vehicle.vehicleId, amountUsd: numericAmount, cardholderName: cardholderName.trim(), cardNumber: cardNumber.replace(/\s/g, ''), expiryMonth: Number(expiryMonth), expiryYear: Number(expiryYear), cvv, idempotencyKey: `card-${vehicle.vehicleId}-${Date.now()}` });
  };
  return <div className="cc-card-payment-modal" role="dialog" aria-modal="true" aria-labelledby="card-payment-title">
    <div className="cc-card-payment-modal__backdrop" onClick={onClose} />
    <form className="cc-card-payment-modal__dialog" onSubmit={submit}>
      <header><h2 id="card-payment-title">Pay by Card</h2><button type="button" onClick={onClose} aria-label="Close payment form">×</button></header>
      <p>{vehicle.year} {vehicle.make} {vehicle.model}</p>
      <p><strong>Outstanding balance: ${balance.toLocaleString()} USD</strong></p>
      <label>Payment amount (USD)<input type="number" min="0.01" max={balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
      <label>Cardholder name<input value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} autoComplete="cc-name" required /></label>
      <label>Card number {cardBrand && <small>{cardBrand}</small>}<input inputMode="numeric" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} autoComplete="cc-number" placeholder="4111 1111 1111 1111" required /></label>
      <div className="cc-card-payment-modal__row"><label>Expiry month<input inputMode="numeric" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} placeholder="MM" required /></label><label>Expiry year<input inputMode="numeric" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} placeholder="YYYY" required /></label><label>CVV<input type="password" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value)} autoComplete="cc-csc" required /></label></div>
      {(validationError || error) && <p role="alert" className="cc-card-payment-modal__error">{validationError || error}</p>}
      <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit Payment'}</button></footer>
    </form>
  </div>;
};
