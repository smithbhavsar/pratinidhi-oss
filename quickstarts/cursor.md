# Cursor

Cursor connects with an API key.

1. Create a key in the dashboard: [app.pratinidhi.unitycodelabs.com](https://app.pratinidhi.unitycodelabs.com) →
   your Toolkit wallet → **API keys**.
2. Add the server to `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project):

   ```json
   {
     "mcpServers": {
       "pratinidhi": {
         "url": "https://mcp.pratinidhi.unitycodelabs.com/mcp",
         "headers": { "x-api-key": "pk_test_your_key" }
       }
     }
   }
   ```

   Keep a file with a real key out of version control.

3. Open Cursor's MCP settings and check that **pratinidhi** is enabled and lists its tools.
4. Ask in chat, for example: *"Is 27AAPFU0939F1ZV a well-formed GSTIN?"*

When a paid tool needs more credit, the answer includes a top-up link and nothing is charged for that call.
