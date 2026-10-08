/**
 * Read a GST invoice with extract_invoice (₹10.00 per invoice, up to 2 pages), safely retryable.
 *
 *   PRATINIDHI_API_KEY=pk_test_… npm start -- https://example.com/invoice.pdf
 *
 * Preview: invoices are read by an LLM provider outside India. Use sample invoices only, never real customer data.
 */
import { randomUUID } from 'node:crypto';
import { Pratinidhi, PratinidhiError } from '@pratinidhi/client';

const apiKey = process.env.PRATINIDHI_API_KEY;
const url = process.argv[2];
if (!apiKey || !url) throw new Error('Usage: PRATINIDHI_API_KEY=pk_… npm start -- <https URL of a PDF, PNG or JPEG>');
const invoice = { url };
const pt = new Pratinidhi({ apiKey, ...(process.env.PRATINIDHI_URL ? { url: process.env.PRATINIDHI_URL } : {}) });

// One key per invoice: if the network drops and we retry, the server returns the first result and charges once.
const idempotencyKey = `invoice-${randomUUID()}`;

async function extract(attempt = 1): Promise<void> {
  try {
    const { data, text } = await pt.extractInvoice(invoice, { idempotencyKey });
    console.log(text);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    if (err instanceof PratinidhiError) {
      if (err.code === 'insufficient_credit') console.error(`${err.message}\nTop up: ${err.data.topup_url}`);
      else console.error(`${err.code}: ${err.message}`); // e.g. invalid_input for a 3-page PDF; nothing charged
      return;
    }
    if (attempt < 3) return extract(attempt + 1); // a network error: same key, so no double charge
    throw err;
  }
}

await extract();
await pt.close();
