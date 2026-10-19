import { Resend } from "resend";
import type { Email } from "./templates";

/**
 * Outbound mail, via Resend.
 *
 * Every send is best-effort and deliberately swallows its own failures: these
 * are called from checkout, sign-up and payment-callback paths, and an order
 * that was placed and paid for must never be reported as failed because a
 * receipt could not be delivered. Failures are logged instead, loudly enough
 * to find in the host's logs.
 *
 * Requires RESEND_API_KEY and EMAIL_FROM. EMAIL_FROM must be an address on a
 * domain verified in Resend (DKIM/SPF records on oliviaglow.lk) — anything
 * else is accepted by the API and then silently filtered by the recipient.
 */

const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
const from = (process.env.EMAIL_FROM ?? "").trim();
const replyTo = (process.env.EMAIL_REPLY_TO ?? "").trim();
/** Copies every order/invoice mail to the shop, for a record outside the DB. */
const bcc = (process.env.EMAIL_BCC ?? "").trim();

let client: Resend | null = null;

export const isEmailConfigured = (): boolean => Boolean(apiKey && from);

function resend(): Resend | null {
  if (!isEmailConfigured()) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export interface SendOptions {
  /** Adds the shop as BCC. Used for order and invoice mail, not for OTPs. */
  copyShop?: boolean;
}

export async function sendEmail(
  to: string | undefined | null,
  email: Email,
  options: SendOptions = {},
): Promise<boolean> {
  const recipient = (to ?? "").trim();
  if (!recipient) return false;

  const mailer = resend();
  if (!mailer) {
    console.warn(
      `[email] not sent ("${email.subject}") — set RESEND_API_KEY and EMAIL_FROM to enable outbound mail`,
    );
    return false;
  }

  try {
    const { error } = await mailer.emails.send({
      from,
      to: recipient,
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(replyTo ? { replyTo } : {}),
      ...(options.copyShop && bcc ? { bcc } : {}),
    });

    if (error) {
      console.error(`[email] send failed ("${email.subject}" to ${recipient}):`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] send threw ("${email.subject}" to ${recipient}):`, (error as Error).message);
    return false;
  }
}
