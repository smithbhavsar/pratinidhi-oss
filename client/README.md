# @pratinidhi/client

TypeScript client for the [Pratinidhi India Toolkit](../README.md). One method per tool; results come back as
`{ data, text }`, and refusals (low credit, daily free limit, bad input) are thrown as `PratinidhiError` with a
`code` and details. Nothing is charged for a refused call.

```ts
import { Pratinidhi } from '@pratinidhi/client';

const pt = new Pratinidhi({ apiKey: process.env.PRATINIDHI_API_KEY! });
const { data } = await pt.pincodeLookup('411005');
await pt.close();
```

Not published to npm yet. See [quickstarts/node.md](../quickstarts/node.md).
