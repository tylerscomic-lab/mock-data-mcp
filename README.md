# mock-data-mcp

Developer MCP server for generating realistic mock and test data on demand. Works natively inside Claude, Cursor, Windsurf, or any MCP-compatible AI client.

**Live on MCPize:** [mcpize.com/mcp/mock-data-mcp](https://mcpize.com/mcp/mock-data-mcp)

---

## Tools

| Tool | Description |
|------|-------------|
| `generate_user_data` | Generate realistic user profiles with names, emails, addresses, and demographics |
| `generate_product_data` | Create mock product catalogs with names, SKUs, descriptions, and pricing |
| `generate_financial_data` | Generate realistic transaction records, account data, and financial history |
| `generate_api_response` | Create mock API responses matching a schema for testing and development |
| `generate_custom_dataset` | Generate any structured dataset based on a field schema and count |
| `generate_json_data` | Generate JSON data matching any schema description |

---

## Usage

Use via MCPize gateway (no local setup required):

```json
{
  "mcpServers": {
    "mock-data": {
      "url": "https://mock-data-mcp.mcpize.run/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCPIZE_API_KEY"
      }
    }
  }
}
```

Or run locally:

```bash
git clone https://github.com/tylerscomic-lab/mock-data-mcp
cd mock-data-mcp
npm install
node server.js
```

---

## Examples

```
generate_user_data(count: 10, locale: "en_US", include_fields: "name,email,phone,address,dob")

generate_product_data(count: 20, category: "electronics", include_fields: "name,sku,price,description,stock")

generate_api_response(
  schema: "{ id: string, user: { name, email }, items: [{ productId, quantity, price }], total: number }",
  count: 5
)
```

---

## Pricing

Available on [MCPize marketplace](https://mcpize.com/mcp/mock-data-mcp):
- **Free:** 20 requests/day
- **Pro:** $9.99/month — unlimited requests

---

## More MCP Servers

Browse the full suite: [mcpize.com](https://mcpize.com) | GitHub org: [github.com/tylerscomic-lab](https://github.com/tylerscomic-lab)
