/**
 * Numeric values of `ErrorCode` from `@revenuecat/purchases-js` 1.58. Mirrored here (and pinned by a
 * test against the real enum) so error messages never force the SDK chunk to load.
 */
export const PURCHASE_ERROR_CODES = {
  userCancelled: 1,
  storeProblem: 2,
  purchaseNotAllowed: 3,
  productAlreadyPurchased: 6,
  network: 10,
  paymentPending: 20,
  configuration: 23,
} as const;

function errorCodeOf(error: unknown): number | null {
  if (typeof error === 'object' && error !== null && 'errorCode' in error) {
    const code = (error as { errorCode: unknown }).errorCode;
    return typeof code === 'number' ? code : null;
  }
  return null;
}

export function isPurchaseCancelled(error: unknown): boolean {
  return errorCodeOf(error) === PURCHASE_ERROR_CODES.userCancelled;
}

/** Locale key (all already translated) for a failed purchase or restore. */
export function purchaseErrorMessageKey(error: unknown): string {
  switch (errorCodeOf(error)) {
    case PURCHASE_ERROR_CODES.network:
      return 'premiumPurchaseNetworkError';
    case PURCHASE_ERROR_CODES.storeProblem:
    case PURCHASE_ERROR_CODES.purchaseNotAllowed:
    case PURCHASE_ERROR_CODES.configuration:
      return 'premiumPurchaseStoreError';
    case PURCHASE_ERROR_CODES.paymentPending:
      return 'premiumPurchasePending';
    case PURCHASE_ERROR_CODES.productAlreadyPurchased:
      return 'premiumPurchaseAlreadyOwned';
    default:
      return 'premiumPurchaseError';
  }
}
