"use client";

const REPORTS = [
  { type: "orders", title: "Orders", copy: "One row per order with totals, status and delivery city." },
  { type: "order-lines", title: "Order lines", copy: "One row per product sold — the sheet to pivot for bestsellers." },
  { type: "products", title: "Products", copy: "Full catalogue with price, stock level and stock value." },
  { type: "customers", title: "Customers", copy: "Accounts with order count and lifetime value." },
];

export function ReportsPanel() {
  return (
    <section className="manager">
      <p className="admin-lead">
        Each export is a UTF-8 CSV that opens directly in Excel, Numbers or Google Sheets.
      </p>

      <div className="admin-report-grid">
        {REPORTS.map((report) => (
          <article className="admin-panel" key={report.type}>
            <h3>{report.title}</h3>
            <p>{report.copy}</p>
            <a className="primary-action admin-download" href={`/api/admin/reports?type=${report.type}`} download>
              Download CSV
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
