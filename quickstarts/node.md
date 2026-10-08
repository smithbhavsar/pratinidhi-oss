# Node.js

You need an API key: [app.pratinidhi.unitycodelabs.com](https://app.pratinidhi.unitycodelabs.com) → your Toolkit
wallet → **API keys**. Node 22 or later.

## With the official MCP SDK

Works today, with nothing from this repository:

```sh
npm install @modelcontextprotocol/sdk
```

```ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(new URL('https://mcp.pratinidhi.unitycodelabs.com/mcp'), {
  requestInit: { headers: { 'x-api-key': process.env.PRATINIDHI_API_KEY! } },
});
const client = new Client({ name: 'my-app', version: '1.0.0' });
await client.connect(transport);

const result = await client.callTool({ name: 'ifsc_lookup', arguments: { ifsc: 'HDFC0000001' } });
console.log(result.structuredContent); // the data; result.isError is true when the call was refused
await client.close();
```

## With `@pratinidhi/client`

A thin typed wrapper: one method per tool, and refusals thrown as `PratinidhiError` with a `code` such as
`insufficient_credit`. It isn't on npm yet; use it from this repository:

```sh
git clone https://github.com/smithbhavsar/pratinidhi-oss && cd pratinidhi-oss
npm install
PRATINIDHI_API_KEY=pk_test_your_key npm start -w pratinidhi-example-node-quickstart
```

```ts
import { Pratinidhi, PratinidhiError } from '@pratinidhi/client';

const pt = new Pratinidhi({ apiKey: process.env.PRATINIDHI_API_KEY! });
const { data, text } = await pt.gstCalculate({ amount: '10000', ratePercent: '18', supplierState: '27', placeOfSupply: '29' });

try {
  await pt.extractInvoice({ url: 'https://example.com/sample-invoice.pdf' }, { idempotencyKey: 'invoice-0001' });
} catch (err) {
  if (err instanceof PratinidhiError && err.code === 'insufficient_credit') console.log('Top up at', err.data.topup_url);
}
```

Amounts in results are **paise as strings** (`"118000"` is ₹1,180.00), so they never pass through floating point.

See [examples/](../examples) for complete programs.
