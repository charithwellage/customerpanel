import { describe, expect, it } from 'vitest';
import { createStore } from '../store.js';

describe('customer card payments', () => {
  it('creates a pending masked card payment for an owned vehicle', async () => {
    const store = createStore('');
    const vehicle = await store.getCustomerVehicleById('cust-123', 'veh-pi-1', '2026-08-10T10:00:00.000Z');
    expect(vehicle?.cardPaymentEligibility?.eligible).toBe(true);
    const payment = await store.createCustomerCardPayment('cust-123', {
      vehicleId: 'veh-pi-1', amountUsd: 100, cardholderName: 'Demo Customer',
      cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2030, cvv: '123', idempotencyKey: 'card-test-1',
    }, '2026-08-10T10:00:00.000Z');
    expect(payment.status).toBe('Pending');
    expect(payment.paymentMethod).toBe('Card');
    expect(payment.cardLast4).toBe('1111');
    expect(payment.gatewayProvider).toBe('MockCardGateway');
    expect(payment).not.toHaveProperty('cardNumber');
    expect(payment).not.toHaveProperty('cvv');
    const duplicate = await store.createCustomerCardPayment('cust-123', {
      vehicleId: 'veh-pi-1', amountUsd: 100, cardholderName: 'Demo Customer',
      cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2030, cvv: '123', idempotencyKey: 'card-test-1',
    }, '2026-08-10T10:00:00.000Z');
    expect(duplicate.id).toBe(payment.id);
    expect((await store.listCustomerPayments('cust-123')).items.filter((item) => item.id === payment.id)).toHaveLength(1);
  });

  it('rejects over-balance and cross-customer attempts', async () => {
    const store = createStore('');
    const vehicle = await store.getCustomerVehicleById('cust-123', 'veh-pi-1', '2026-08-10T10:00:00.000Z');
    await expect(store.createCustomerCardPayment('cust-123', {
      vehicleId: 'veh-pi-1', amountUsd: (vehicle?.balanceAmountUsd || 0) + 1, cardholderName: 'Demo Customer',
      cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2030, cvv: '123', idempotencyKey: 'card-over-1',
    }, '2026-08-10T10:00:00.000Z')).rejects.toThrow(/outstanding/i);
    await expect(store.createCustomerCardPayment('cust-other', {
      vehicleId: 'veh-pi-1', amountUsd: 10, cardholderName: 'Other Customer',
      cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2030, cvv: '123', idempotencyKey: 'card-other-1',
    }, '2026-08-10T10:00:00.000Z')).rejects.toThrow(/not owned/);
  });

  it('allows an active reserved vehicle to make a pending card payment', async () => {
    const store = createStore('');
    const vehicle = await store.getCustomerVehicleById('cust-123', 'veh-6', '2026-08-10T10:00:00.000Z');
    expect(vehicle?.status).toBe('Under Negotiation');
    expect(vehicle?.cardPaymentEligibility?.eligible).toBe(true);
    const payment = await store.createCustomerCardPayment('cust-123', {
      vehicleId: 'veh-6', amountUsd: 50, cardholderName: 'Demo Customer',
      cardNumber: '4111111111111111', expiryMonth: 12, expiryYear: 2030, cvv: '123', idempotencyKey: 'card-reserved-1',
    }, '2026-08-10T10:00:00.000Z');
    expect(payment.status).toBe('Pending');
    expect(payment.vehicleId).toBe('veh-6');
  });
});
