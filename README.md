# Pratinidhi India Toolkit

Indian business data tools for AI agents: IFSC, pincode, GSTIN, PAN, HSN/SAC, GST maths, rupees in words and GST
invoice extraction. Use them from **one MCP URL** with **one account** and **one prepaid UPI wallet**, in Claude,
ChatGPT, Cursor or your own code.

```
https://mcp.pratinidhi.unitycodelabs.com/mcp
```

This repository holds the client SDK, examples and quickstarts. The hosted service itself is run by
[Unity Code Labs](https://unitycodelabs.com).

## Quickstarts

| Where | How you sign in | Guide |
| --- | --- | --- |
| Claude (web, desktop) and Claude Code | Sign in with your email (OAuth) or an API key | [quickstarts/claude.md](quickstarts/claude.md) |
| ChatGPT | Sign in with your email (OAuth) | [quickstarts/chatgpt.md](quickstarts/chatgpt.md) |
| Cursor | API key | [quickstarts/cursor.md](quickstarts/cursor.md) |
| Node.js | API key | [quickstarts/node.md](quickstarts/node.md) |

Get an account, an API key and your wallet at
[app.pratinidhi.unitycodelabs.com/toolkit](https://app.pratinidhi.unitycodelabs.com/toolkit).

## Tools and prices

| Tool | What it does | Price |
| --- | --- | --- |
| `ifsc_lookup` | Bank branch for an IFSC: address, MICR, SWIFT, IMPS/NEFT/RTGS/UPI support | Free |
| `pincode_lookup` | District, state and post offices for a pincode | Free |
| `validate_gstin` | GSTIN structure and check digit, with state and PAN decoded | Free |
| `validate_pan` | PAN structure and holder type | Free |
| `hsn_sac_lookup` | HSN/SAC codes and descriptions, by code or by words (no GST rates) | Free |
| `gst_calculate` | GST on an amount, exact to the paisa, split into CGST + SGST or IGST | Free |
| `rupees_in_words` | An amount in Indian-English words, as on cheques and invoices | Free |
| `request_api` | Tell us which India API you need next | Free |
| `bulk_check_gstin_format` | Up to 100 GSTINs: format and check digit (not whether they are active) | ₹1.00 per call |
| `extract_invoice` | GST invoice fields from a PDF or image, up to 2 pages, with consistency checks | ₹10.00 per invoice |

- Free tools count toward **1,000 free calls a day** per account (resets at midnight IST).
- Paid tools are charged to your wallet. You top up by UPI; 18% GST is added at top-up and you get a GST receipt.
  Wallet credit can only be spent on the Toolkit.
- You are charged only when a call succeeds. A failed or refused call costs nothing.
- Paid tools take an optional `idempotency_key`. Retry with the same key and you get the first result back,
  charged once.
- A monthly spending cap can be set in the dashboard.

> **`extract_invoice` is in preview.** Invoices are read by an LLM provider whose servers are outside India.
> Use sample invoices only, not real customer data, until this notice is removed.

`validate_gstin` and `bulk_check_gstin_format` check structure only. They do not tell you whether a GSTIN is
registered, active or cancelled.

## Repository layout

```
client/      @pratinidhi/client, a small TypeScript client (not on npm yet)
examples/    node-quickstart (free tools), invoice (a paid, retry-safe call)
quickstarts/ Claude, ChatGPT, Cursor, Node
```

```sh
npm install
npm test          # client tests against a local stand-in server
PRATINIDHI_API_KEY=pk_test_… npm start -w pratinidhi-example-node-quickstart
```

## Data sources and credits

- IFSC: [Razorpay IFSC](https://github.com/razorpay/ifsc) (RBI/NPCI data).
- Pincodes: All India Pincode Directory, Department of Posts, via data.gov.in (Government Open Data License – India).
- HSN/SAC: GST portal master (codes and descriptions).
- Parts of the GSTIN and PAN decoding are ported from
  [MCP-India-Stack](https://github.com/rehan1020/MCP-India-Stack) (MIT).

## Licence

MIT, see [LICENSE](LICENSE). Report security issues as described in [SECURITY.md](SECURITY.md).
