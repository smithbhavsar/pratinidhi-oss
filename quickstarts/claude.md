# Claude

## Claude on the web and desktop

1. In Claude, open **Settings → Connectors** and choose **Add custom connector**.
2. Name it `Pratinidhi India Toolkit` and paste the URL:

   ```
   https://mcp.pratinidhi.unitycodelabs.com/mcp
   ```

3. Choose **Connect**. A Pratinidhi page opens: enter your email, open the sign-in link we send, and choose
   **Allow**. Your first sign-in creates your account and wallet.
4. Ask Claude something that needs a tool, for example *"Which bank branch is IFSC HDFC0000001?"*

Claude only uses tools you allow. Menu names in Claude can change; if these don't match, look for "connectors" in
Claude's help.

## Claude Code

Sign in with your email (Claude Code opens the browser):

```sh
claude mcp add --transport http pratinidhi https://mcp.pratinidhi.unitycodelabs.com/mcp
```

Then run `/mcp` in Claude Code and choose **pratinidhi → Authenticate**.

Or use an API key from the dashboard (**API keys**) instead of signing in:

```sh
claude mcp add --transport http pratinidhi https://mcp.pratinidhi.unitycodelabs.com/mcp \
  --header "x-api-key: pk_test_your_key"
```

## Paid tools

When a paid tool needs more credit than your wallet holds, the tool's answer says so and includes a top-up link.
Nothing is charged for that call. Top up by UPI, then ask again.
