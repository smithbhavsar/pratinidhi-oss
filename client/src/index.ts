import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/** The hosted India Toolkit MCP endpoint. */
export const DEFAULT_URL = 'https://mcp.pratinidhi.unitycodelabs.com/mcp';
export const VERSION = '0.1.0';

export interface PratinidhiOptions {
  /** Your API key (pk_test_… or pk_live_…), from the dashboard's API keys page. */
  apiKey: string;
  /** Override the endpoint, e.g. a sandbox URL. */
  url?: string;
  /** Override fetch (tests, proxies). */
  fetch?: typeof fetch;
}

export interface ToolResult<T = Record<string, unknown>> {
  /** The structured result. Amounts are paise as strings. */
  data: T;
  /** A one-line summary, as an AI client would show it. */
  text: string;
}

/**
 * A tool call the server refused or couldn't complete. Nothing was charged.
 *
 * `code` is the machine-readable reason, e.g. `insufficient_credit` (with `data.topup_url`), `daily_free_limit`,
 * `monthly_cap_exceeded`, `invalid_input`, `duplicate_request` or `tool_failed`.
 */
export class PratinidhiError extends Error {
  override name = 'PratinidhiError';
  constructor(
    readonly code: string,
    message: string,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export interface PaidCallOptions {
  /**
   * Send the same key when retrying the same call: you get the original result back and are charged once.
   * 1–128 characters from A–Z a–z 0–9 . _ : -
   */
  idempotencyKey?: string;
}

/**
 * Client for the Pratinidhi India Toolkit. Free tools count toward 1,000 free calls a day; paid tools are charged to
 * your wallet in rupees.
 *
 * ```ts
 * const pt = new Pratinidhi({ apiKey: process.env.PRATINIDHI_API_KEY! });
 * const { data } = await pt.ifscLookup('HDFC0000001');
 * ```
 */
export class Pratinidhi {
  private client: Promise<Client> | undefined;

  constructor(private readonly opts: PratinidhiOptions) {
    if (!/^pk_(test|live)_[A-Za-z0-9_]{8,200}$/.test(opts.apiKey ?? '')) {
      throw new TypeError('apiKey should look like pk_test_… or pk_live_…');
    }
  }

  private connect(): Promise<Client> {
    this.client ??= (async () => {
      const transport = new StreamableHTTPClientTransport(new URL(this.opts.url ?? DEFAULT_URL), {
        requestInit: { headers: { 'x-api-key': this.opts.apiKey } },
        ...(this.opts.fetch ? { fetch: this.opts.fetch } : {}),
      });
      const client = new Client({ name: 'pratinidhi-client', version: VERSION });
      // The SDK's types predate `exactOptionalPropertyTypes`; the cast keeps strict consumers compiling.
      await client.connect(transport as unknown as Transport);
      return client;
    })().catch((err: unknown) => {
      this.client = undefined; // let the next call try again
      throw err;
    });
    return this.client;
  }

  /** The tools available to your key, with descriptions that include the current price. */
  async listTools(): Promise<{ name: string; title?: string; description?: string }[]> {
    const { tools } = await (await this.connect()).listTools();
    return tools.map((t) => ({
      name: t.name,
      ...(t.title ? { title: t.title } : {}),
      ...(t.description ? { description: t.description } : {}),
    }));
  }

  /** Call any tool by name. Throws `PratinidhiError` when the server refuses; nothing is charged then. */
  async callTool<T = Record<string, unknown>>(
    name: string,
    args: Record<string, unknown> = {},
  ): Promise<ToolResult<T>> {
    const result = (await (await this.connect()).callTool({ name, arguments: args })) as CallToolResult;
    const text = result.content.find((c) => c.type === 'text')?.text ?? '';
    const data = (result.structuredContent ?? {}) as Record<string, unknown>;
    if (result.isError) {
      throw new PratinidhiError(typeof data.error === 'string' ? data.error : 'tool_error', text, data);
    }
    return { data: data as T, text };
  }

  /** Bank branch for an IFSC code: address, MICR, SWIFT and which payment systems it supports. Free. */
  ifscLookup(ifsc: string) {
    return this.callTool('ifsc_lookup', { ifsc });
  }

  /** Post offices, district and state for a pincode. Free. */
  pincodeLookup(pincode: string) {
    return this.callTool('pincode_lookup', { pincode });
  }

  /** GSTIN structure and check digit, with the state and PAN decoded. Not whether it is registered or active. Free. */
  validateGstin(gstin: string) {
    return this.callTool('validate_gstin', { gstin });
  }

  /** PAN structure and holder type. A well-formed PAN may still not exist. Free. */
  validatePan(pan: string) {
    return this.callTool('validate_pan', { pan });
  }

  /** HSN (goods) or SAC (services) by code or by words. Codes and descriptions only, no GST rates. Free. */
  hsnSacLookup(q: { code?: string; query?: string; kind?: 'goods' | 'services' }) {
    return this.callTool('hsn_sac_lookup', q);
  }

  /**
   * GST on an amount in rupees (a string, e.g. "1180.50"), exact to the paisa. Give both two-digit state codes to
   * split it into CGST + SGST or IGST. Free.
   */
  gstCalculate(q: {
    amount: string;
    ratePercent: string;
    amountIncludesGst?: boolean;
    supplierState?: string;
    placeOfSupply?: string;
  }) {
    return this.callTool('gst_calculate', {
      amount: q.amount,
      rate_percent: q.ratePercent,
      ...(q.amountIncludesGst === undefined ? {} : { amount_includes_gst: q.amountIncludesGst }),
      ...(q.supplierState === undefined ? {} : { supplier_state: q.supplierState }),
      ...(q.placeOfSupply === undefined ? {} : { place_of_supply: q.placeOfSupply }),
    });
  }

  /** An amount in rupees in Indian-English words, for invoices and cheques. Free. */
  rupeesInWords(amount: string) {
    return this.callTool('rupees_in_words', { amount });
  }

  /** Ask for an API the Toolkit doesn't have yet. Free. */
  requestApi(q: { apiName: string; useCase?: string; wouldPayPerCall?: string }) {
    return this.callTool('request_api', {
      api_name: q.apiName,
      ...(q.useCase === undefined ? {} : { use_case: q.useCase }),
      ...(q.wouldPayPerCall === undefined ? {} : { would_pay_per_call: q.wouldPayPerCall }),
    });
  }

  /** Format and check digit of up to 100 GSTINs in one call (not whether they are active). Paid. */
  bulkCheckGstinFormat(gstins: string[], opts: PaidCallOptions = {}) {
    return this.callTool('bulk_check_gstin_format', { gstins, ...idempotency(opts) });
  }

  /** Fields of a GST invoice (PDF, PNG or JPEG, up to 2 pages) from a public https URL or base64. Paid. */
  extractInvoice(file: { url: string } | { base64: string }, opts: PaidCallOptions = {}) {
    return this.callTool('extract_invoice', {
      ...('url' in file ? { file_url: file.url } : { file_base64: file.base64 }),
      ...idempotency(opts),
    });
  }

  /** Close the connection. */
  async close(): Promise<void> {
    const client = await this.client?.catch(() => undefined);
    this.client = undefined;
    await client?.close();
  }
}

const idempotency = (opts: PaidCallOptions) =>
  opts.idempotencyKey === undefined ? {} : { idempotency_key: opts.idempotencyKey };
