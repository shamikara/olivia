import type { NextRequest } from "next/server";

/**
 * The origin a payment gateway should send the shopper back to.
 *
 * Derived from the request so previews and staging work without configuration,
 * but `NEXT_PUBLIC_SITE_URL` wins when set — the forwarded headers are supplied
 * by whatever proxy is in front of us and are not something to trust blindly
 * for a URL we are about to hand a payment provider.
 *
 * Note for local testing: Koko posts its callback server-to-server, so it can
 * never reach `localhost`. Point this at a tunnel (ngrok, cloudflared) when
 * testing against the sandbox.
 */
export function siteOrigin(request: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (configured) return configured;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  return request.nextUrl.origin;
}
