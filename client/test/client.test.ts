import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Pratinidhi, PratinidhiError } from '../src/index.js';

const KEY = 'pk_test_abcdefghijklmnop';

/** A stand-in for the hosted server: the same result shapes, no metering. */
function toolkitStandIn(seen: { apiKey?: string; args: Record<string, unknown>[] }) {
  const server = new McpServer({ name: 'stand-in', version: '1.0.0' });
  server.registerTool('ifsc_lookup', { inputSchema: { ifsc: z.string() } }, async (args) => {
    seen.args.push(args);
    return {
      content: [{ type: 'text', text: 'HDFC Bank, Sandoz House branch.' }],
      structuredContent: { ifsc: args.ifsc, bank: 'HDFC Bank' },
    };
  });
  server.registerTool(
    'extract_invoice',
    { inputSchema: { file_url: z.string().optional(), idempotency_key: z.string().optional() } },
    async (args) => {
      seen.args.push(args);
      return {
        isError: true,
        content: [{ type: 'text', text: 'Your Pratinidhi wallet has ₹0.00; extract_invoice costs ₹10.00.' }],
        structuredContent: { error: 'insufficient_credit', price: '1000', topup_url: 'https://app.test/a/1' },
      };
    },
  );
  return server;
}

describe('Pratinidhi client', () => {
  let http: Server;
  let url: string;
  const seen: { apiKey?: string; args: Record<string, unknown>[] } = { args: [] };

  beforeAll(async () => {
    http = createServer(async (req: IncomingMessage, res) => {
      seen.apiKey = String(req.headers['x-api-key'] ?? '');
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
      const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });
      await toolkitStandIn(seen).connect(transport as unknown as Transport); // see src/index.ts
      await transport.handleRequest(req, res, body);
    });
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(http.address() as AddressInfo).port}/mcp`;
  });
  afterAll(() => {
    http.closeAllConnections();
    http.close();
  });

  it('refuses something that is not an API key', () => {
    expect(() => new Pratinidhi({ apiKey: 'sk-something' })).toThrow(/pk_test_/);
  });

  it('sends the key in x-api-key and returns structured data with the summary', async () => {
    const pt = new Pratinidhi({ apiKey: KEY, url });
    const r = await pt.ifscLookup('HDFC0000001');
    expect(r).toEqual({ data: { ifsc: 'HDFC0000001', bank: 'HDFC Bank' }, text: 'HDFC Bank, Sandoz House branch.' });
    expect(seen.apiKey).toBe(KEY);
    expect((await pt.listTools()).map((t) => t.name)).toEqual(['ifsc_lookup', 'extract_invoice']);
    await pt.close();
  });

  it('throws PratinidhiError with the reason and details when the server refuses', async () => {
    const pt = new Pratinidhi({ apiKey: KEY, url });
    const err = await pt
      .extractInvoice({ url: 'https://files.example/inv.pdf' }, { idempotencyKey: 'inv-42' })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PratinidhiError);
    expect(err).toMatchObject({ code: 'insufficient_credit', data: { topup_url: 'https://app.test/a/1' } });
    expect(String((err as Error).message)).toMatch(/costs ₹10\.00/);
    expect(seen.args.at(-1)).toEqual({ file_url: 'https://files.example/inv.pdf', idempotency_key: 'inv-42' });
    await pt.close();
  });
});
