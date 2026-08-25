import type { CustomerPaymentMethod } from '@carchief/domain';

export function getPaymentTypeLabel(paymentMethod: CustomerPaymentMethod): 'TT' | 'Online Payment' {
  return paymentMethod === 'Card' ? 'Online Payment' : 'TT';
}
