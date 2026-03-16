// Scope of Work Template Generator — Assured Energy Solutions
// Generates printable HTML documents for Pre-Work and Post-Work SOWs

const COMPANY = {
  name: 'Assured Energy Solutions',
  address: '22530 S Center Road, Frankfort, IL 60423',
  program: 'Home Energy Savings Program — Income Eligible',
};

function logoHTML() {
  return `
    <div style="text-align:center; margin-bottom:8px;">
      <div style="font-size:32px; font-weight:900; color:#dc2626; letter-spacing:2px; line-height:1.1;">ASSURED</div>
      <div style="font-size:13px; font-weight:700; color:#1e293b; letter-spacing:3px; text-transform:uppercase;">Energy Solutions</div>
    </div>
  `;
}

function baseStyles() {
  return `
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1e293b;
        font-size: 13px;
        line-height: 1.5;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
      }
      h1 {
        font-size: 18px;
        font-weight: 700;
        text-align: center;
        margin: 16px 0 24px;
        color: #1e293b;
        letter-spacing: -0.3px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 24px;
        margin-bottom: 24px;
        padding: 14px 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
      }
      .info-row {
        display: flex;
        gap: 8px;
      }
      .info-label {
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        color: #64748b;
        min-width: 80px;
      }
      .info-value {
        font-size: 13px;
        color: #1e293b;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 24px;
        font-size: 13px;
      }
      th {
        background: #0f172a;
        color: #fff;
        padding: 10px 12px;
        text-align: left;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      td {
        padding: 9px 12px;
        border-bottom: 1px solid #e2e8f0;
      }
      tr:nth-child(even) { background: #f8fafc; }
      .section-title {
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        margin: 24px 0 10px;
        padding-bottom: 6px;
        border-bottom: 2px solid #e2e8f0;
      }
      .auth-text {
        margin: 28px 0 32px;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.6;
      }
      .sig-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 20px;
      }
      .sig-block {
        padding-top: 8px;
      }
      .sig-line {
        border-bottom: 1px solid #1e293b;
        height: 32px;
        margin-bottom: 4px;
      }
      .sig-label {
        font-size: 11px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .footer {
        margin-top: 40px;
        padding-top: 12px;
        border-top: 2px solid #e2e8f0;
        text-align: center;
        font-size: 11px;
        color: #64748b;
      }
      .footer .company { font-weight: 700; color: #1e293b; }
      @media print {
        body { padding: 20px; }
        .auth-text { break-inside: avoid; }
        .sig-grid { break-inside: avoid; }
      }
    </style>
  `;
}

function customerInfoHTML(job) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Customer</span><span class="info-value">${esc(job.customer_name)}</span></div>
      <div class="info-row"><span class="info-label">Job #</span><span class="info-value">${esc(job.job_number || '—')}</span></div>
      <div class="info-row"><span class="info-label">Address</span><span class="info-value">${esc(job.address)}${job.city ? ', ' + esc(job.city) : ''}${job.zip ? ' ' + esc(job.zip) : ''}</span></div>
      <div class="info-row"><span class="info-label">Date</span><span class="info-value">${today}</span></div>
      <div class="info-row"><span class="info-label">Utility</span><span class="info-value">${esc(job.utility || '—')}</span></div>
      <div class="info-row"><span class="info-label">Assessor</span><span class="info-value">${esc(job.assessor_name || '—')}</span></div>
    </div>
  `;
}

function measuresTableHTML(measures) {
  if (!measures || measures.length === 0) {
    return '<p style="color:#64748b; font-style:italic;">No measures specified.</p>';
  }
  const rows = measures.map(m => `
    <tr>
      <td>${esc(m.name)}</td>
      <td style="text-align:center;">${esc(String(m.qty ?? ''))}</td>
      <td style="text-align:center;">${esc(m.unit || '')}</td>
      <td>${esc(m.notes || '')}</td>
    </tr>
  `).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Measure</th>
          <th style="text-align:center; width:70px;">Qty</th>
          <th style="text-align:center; width:70px;">Unit</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function signatureBlockHTML() {
  return `
    <div class="sig-grid">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Customer Signature</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Printed Name</div>
      </div>
    </div>
    <div class="sig-grid">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Date</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Staff Signature</div>
      </div>
    </div>
    <div class="sig-grid">
      <div class="sig-block"></div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Date</div>
      </div>
    </div>
  `;
}

function footerHTML() {
  return `
    <div class="footer">
      <div class="company">${esc(COMPANY.name)}</div>
      <div>${esc(COMPANY.address)}</div>
      <div style="margin-top:4px; font-weight:600;">${esc(COMPANY.program)}</div>
    </div>
  `;
}

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate a Pre-Work Scope of Work as a printable HTML document.
 * @param {Object} job - { customer_name, address, city, zip, utility, job_number, assessor_name }
 * @param {Array} measures - [{ name, qty, unit, notes }]
 * @returns {string} Full HTML document string
 */
export function generatePreWorkSOW(job, measures) {
  const hsMeasures = measures.filter(m => /h\s*[&/]\s*s|health|safety/i.test(m.name));
  const workMeasures = measures.filter(m => !/h\s*[&/]\s*s|health|safety/i.test(m.name));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pre-Work SOW — ${esc(job.customer_name)}</title>
  ${baseStyles()}
</head>
<body>
  ${logoHTML()}
  <h1>Pre-Work Scope of Work &mdash; Authorization to Proceed</h1>
  ${customerInfoHTML(job)}

  <div class="section-title">Measures to Be Performed</div>
  ${measuresTableHTML(workMeasures)}

  ${hsMeasures.length > 0 ? `
  <div class="section-title">Health &amp; Safety Measures</div>
  ${measuresTableHTML(hsMeasures)}
  ` : ''}

  <div class="auth-text">
    By signing below, I authorize <strong>${esc(COMPANY.name)}</strong> to perform the work described above at my property. I understand this work is provided at no cost to me through the ${esc(COMPANY.program)}.
  </div>

  ${signatureBlockHTML()}
  ${footerHTML()}
</body>
</html>`;
}

/**
 * Generate a Post-Work Scope of Work as a printable HTML document.
 * @param {Object} job - { customer_name, address, city, zip, utility, job_number, assessor_name }
 * @param {Array} measures - [{ name, qty, unit, notes }]
 * @param {Array} changeOrders - [{ description, reason }] or null
 * @returns {string} Full HTML document string
 */
export function generatePostWorkSOW(job, measures, changeOrders) {
  const hsMeasures = measures.filter(m => /h\s*[&/]\s*s|health|safety/i.test(m.name));
  const workMeasures = measures.filter(m => !/h\s*[&/]\s*s|health|safety/i.test(m.name));

  const changeOrdersHTML = changeOrders && changeOrders.length > 0 ? `
    <div class="section-title">Change Orders</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        ${changeOrders.map(co => `
          <tr>
            <td>${esc(co.description)}</td>
            <td>${esc(co.reason || '')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Post-Work SOW — ${esc(job.customer_name)}</title>
  ${baseStyles()}
</head>
<body>
  ${logoHTML()}
  <h1>Post-Work Scope of Work &mdash; Completion Acknowledgment</h1>
  ${customerInfoHTML(job)}

  <div class="section-title">Work Completed</div>
  ${measuresTableHTML(workMeasures)}

  ${hsMeasures.length > 0 ? `
  <div class="section-title">Health &amp; Safety Measures</div>
  ${measuresTableHTML(hsMeasures)}
  ` : ''}

  ${changeOrdersHTML}

  <div class="auth-text">
    By signing below, I acknowledge that the work described above has been completed at my property to my satisfaction.
  </div>

  ${signatureBlockHTML()}
  ${footerHTML()}
</body>
</html>`;
}

/**
 * Open a new browser window with the given HTML content and trigger print dialog.
 * @param {string} htmlContent - Full HTML document string
 */
export function printSOW(htmlContent) {
  const win = window.open('', '_blank');
  win.document.write(htmlContent);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
