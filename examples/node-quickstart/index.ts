/**
 * Free India Toolkit tools from Node: bank branch, GSTIN check, GST split and rupees in words.
 *
 *   PRATINIDHI_API_KEY=pk_test_… npm start
 */
import { Pratinidhi, PratinidhiError } from '@pratinidhi/client';

const apiKey = process.env.PRATINIDHI_API_KEY;
if (!apiKey) throw new Error('Set PRATINIDHI_API_KEY (dashboard → API keys)');
const pt = new Pratinidhi({ apiKey, ...(process.env.PRATINIDHI_URL ? { url: process.env.PRATINIDHI_URL } : {}) });

try {
  const branch = await pt.ifscLookup('HDFC0000001');
  console.log(branch.text);

  const gstin = await pt.validateGstin('27AAPFU0939F1ZV');
  console.log(gstin.text);

  // ₹10,000 at 18%, supplier in Maharashtra (27), buyer in Karnataka (29): IGST.
  const gst = await pt.gstCalculate({ amount: '10000', ratePercent: '18', supplierState: '27', placeOfSupply: '29' });
  console.log(gst.text);

  const words = await pt.rupeesInWords('11800');
  console.log(words.text);
} catch (err) {
  if (err instanceof PratinidhiError && err.code === 'daily_free_limit') {
    console.error(`${err.message} (resets in ${err.data.resets_in_seconds} s)`);
  } else {
    throw err;
  }
} finally {
  await pt.close();
}
