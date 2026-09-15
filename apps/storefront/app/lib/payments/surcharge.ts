/**
 * Koko's cut — card processing, SSCL, and their own merchant fee, bundled
 * into one number rather than itemised, because Koko doesn't itemise it to
 * us either. Added on top of the order total only when Koko is the chosen
 * payment method, so it never touches cash-on-delivery/WhatsApp/other orders.
 *
 * No node/runtime imports here on purpose: this is used from the checkout
 * page (client component) as well as the order API (server), so it has to be
 * safe to bundle into the browser.
 */
export const KOKO_SURCHARGE_PERCENT = 13;

export function withKokoSurcharge(amountLKR: number): number {
  return Math.round(amountLKR * (1 + KOKO_SURCHARGE_PERCENT / 100));
}
