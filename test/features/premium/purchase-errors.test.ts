import { ErrorCode } from '@revenuecat/purchases-js';
import { describe, expect, it } from 'vitest';

import {
  PURCHASE_ERROR_CODES,
  isPurchaseCancelled,
  purchaseErrorMessageKey,
} from '@/features/premium/lib/purchase-errors';

function err(errorCode: number) {
  return Object.assign(new Error('purchase failed'), { errorCode });
}

describe('purchase error mapping', () => {
  it('mirrors the SDK enum values so the SDK never has to load for a message', () => {
    expect(PURCHASE_ERROR_CODES).toEqual({
      userCancelled: ErrorCode.UserCancelledError,
      storeProblem: ErrorCode.StoreProblemError,
      purchaseNotAllowed: ErrorCode.PurchaseNotAllowedError,
      productAlreadyPurchased: ErrorCode.ProductAlreadyPurchasedError,
      network: ErrorCode.NetworkError,
      paymentPending: ErrorCode.PaymentPendingError,
      configuration: ErrorCode.ConfigurationError,
    });
  });

  it('recognises a cancelled purchase', () => {
    expect(isPurchaseCancelled(err(ErrorCode.UserCancelledError))).toBe(true);
    expect(isPurchaseCancelled(err(ErrorCode.NetworkError))).toBe(false);
    expect(isPurchaseCancelled(new Error('x'))).toBe(false);
    expect(isPurchaseCancelled(null)).toBe(false);
  });

  it('maps codes onto the existing premiumPurchase* locale keys', () => {
    expect(purchaseErrorMessageKey(err(ErrorCode.NetworkError))).toBe('premiumPurchaseNetworkError');
    expect(purchaseErrorMessageKey(err(ErrorCode.StoreProblemError))).toBe('premiumPurchaseStoreError');
    expect(purchaseErrorMessageKey(err(ErrorCode.PurchaseNotAllowedError))).toBe('premiumPurchaseStoreError');
    expect(purchaseErrorMessageKey(err(ErrorCode.ConfigurationError))).toBe('premiumPurchaseStoreError');
    expect(purchaseErrorMessageKey(err(ErrorCode.PaymentPendingError))).toBe('premiumPurchasePending');
    expect(purchaseErrorMessageKey(err(ErrorCode.ProductAlreadyPurchasedError))).toBe(
      'premiumPurchaseAlreadyOwned',
    );
    expect(purchaseErrorMessageKey(new Error('boom'))).toBe('premiumPurchaseError');
  });
});
