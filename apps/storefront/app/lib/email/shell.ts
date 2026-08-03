import { SITE } from "../site";

/*
 * Email HTML is not web HTML. Gmail, Outlook and Apple Mail strip <style>
 * blocks, ignore flexbox and grid, and reset fonts — so everything here is
 * table-based with inline styles, and the display face is Georgia rather than
 * Playfair, which no mail client will have.
 */

export const BRAND = {
  plum: "#1e1018",
  plumRaised: "#2b1822",
  gold: "#b06e58",
  goldBright: "#d9a38a",
  goldSoft: "#e8cdbf",
  paper: "#fbf7f5",
  surface: "#ffffff",
  ink: "#1e1018",
  inkSoft: "#4a3540",
  muted: "#7c6a72",
  line: "#e8e0d6",
  green: "#2f6b53",
} as const;

/** Absolute URLs are required — mail clients cannot resolve relative paths. */
export function siteUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

export const money = (amount: number) => `LKR ${Math.round(amount).toLocaleString("en-US")}`;

export function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;">
      <tr>
        <td align="center" bgcolor="${BRAND.gold}" style="border-radius:999px;">
          <a href="${href}"
             style="display:inline-block;padding:14px 30px;font-family:Helvetica,Arial,sans-serif;font-size:13px;
                    font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:#ffffff;text-decoration:none;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

export function panel(inner: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:${BRAND.paper};border:1px solid ${BRAND.line};border-radius:10px;margin:22px 0;">
      <tr><td style="padding:20px 22px;">${inner}</td></tr>
    </table>`;
}

/** Wraps body HTML in the branded shell. `preview` is the inbox snippet. */
export function wrap({
  title,
  preview,
  body,
}: {
  title: string;
  preview: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
  <!-- Preview text: shown in the inbox list, hidden in the message body. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.paper};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background:${BRAND.surface};border-radius:14px;overflow:hidden;
                      box-shadow:0 2px 10px rgba(45,32,24,.06);">

          <tr>
            <td align="center" bgcolor="${BRAND.plum}" style="padding:30px 24px;border-bottom:2px solid ${BRAND.goldBright};">
              <a href="${siteUrl()}" style="text-decoration:none;">
                <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:5px;
                             color:${BRAND.goldBright};">OLIVIA GLOW</span>
              </a>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;
                          text-transform:uppercase;color:rgba(232,205,191,.6);padding-top:8px;">
                Your natural beauty partner
              </div>
            </td>
          </tr>

          <tr><td style="padding:34px 32px 30px;">${body}</td></tr>

          <tr>
            <td bgcolor="${BRAND.plum}" style="padding:26px 32px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.8;color:rgba(232,205,191,.75);">
                <a href="${SITE.whatsapp}" style="color:${BRAND.goldBright};text-decoration:none;">WhatsApp us</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl("/shop")}" style="color:${BRAND.goldBright};text-decoration:none;">Shop</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl("/account")}" style="color:${BRAND.goldBright};text-decoration:none;">My account</a>
              </div>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;line-height:1.7;
                          color:rgba(232,205,191,.45);padding-top:14px;">
                © ${new Date().getFullYear()} Olivia Glow · Colombo, Sri Lanka<br>
                Islandwide delivery · Cash on delivery available · Pay in 3 with Mintpay, Koko &amp; Payzy
              </div>
            </td>
          </tr>
        </table>

        <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${BRAND.muted};padding-top:16px;">
          Built with Platform OS by SpandhaLabs
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const heading = (text: string) =>
  `<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;
              font-size:27px;line-height:1.25;color:${BRAND.ink};">${text}</h1>`;

export const paragraph = (text: string) =>
  `<p style="margin:0 0 15px;font-family:Helvetica,Arial,sans-serif;font-size:14px;
             line-height:1.75;color:${BRAND.inkSoft};">${text}</p>`;

export const eyebrow = (text: string) =>
  `<p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.4px;
             text-transform:uppercase;color:${BRAND.gold};">${text}</p>`;
