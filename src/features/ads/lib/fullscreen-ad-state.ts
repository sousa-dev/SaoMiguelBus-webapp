let internalFullscreenVisible = false;
let firstPartyInterstitialVisible = false;

export function isInternalFullscreenAdVisible(): boolean {
  return internalFullscreenVisible;
}

export function isFirstPartyInterstitialVisible(): boolean {
  return firstPartyInterstitialVisible;
}

export function setInternalFullscreenAdVisible(visible: boolean): void {
  internalFullscreenVisible = visible;
}

export function setFirstPartyInterstitialVisible(visible: boolean): void {
  firstPartyInterstitialVisible = visible;
}

/** Test helper. */
export function resetFullscreenAdStateForTests(): void {
  internalFullscreenVisible = false;
  firstPartyInterstitialVisible = false;
}
