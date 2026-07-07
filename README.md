# sovereign-mcp

A minimal, dependency-free template for a **self-hosted, governed MCP server** running on Cloudflare Workers, with a defense-in-depth access model.

> This is a **scaffolding template**, not a running deployment. It shows the *shape* of a hardened MCP control plane so you can build your own. All hostnames, tools, and IDs are placeholders.

## Why

The [Model Context Protocol](https://modelcontextprotocol.io) lets agents call tools over a standard interface. If those tools can touch real infrastructure, the server needs to be locked down. This template demonstrates a pattern for doing that.

## Architecture

Two access bridges to the same MCP server:

- **Headless bridge** — for machine-to-machine agent calls. Two independent auth layers are required together: an edge identity check (e.g. a zero-trust access proxy) **and** an origin-side bearer secret verified inside the Worker. Neither alone is sufficient.
- **Human bridge** — a managed MCP portal for browser-based, interactive use behind an OAuth login.

```
  agent -> [edge access proxy] -> [Worker: verify bearer + verify edge JWT] -> tools
  human -> [OAuth portal] -----------------------------------------------------> tools
```

## Security model

- **Default-deny command allowlist** for any tool that shells out. Destructive operations, remote-code-execution pipes, secret-file reads, privilege escalation, and disk-destruction patterns are all refused before execution.
- **No secrets in code.** Everything sensitive is read from environment bindings.
- **Two-factor on privileged calls.** Edge identity *and* origin bearer.

## Files

| File | Purpose |
|------|---------|
| `src/server.js` | MCP server Worker (JSON-RPC 2.0 over Streamable HTTP). Placeholder tools. |
| `src/guard.js` | Example default-deny command guard. |
| `src/deploy.example.py` | Example deploy script (fill in your own account + bindings). |
| `.env.example` | The environment variables you'd supply. |

## Use

1. Copy `.env.example` to `.env` and fill in your own values.
2. Replace the placeholder tools in `src/server.js` with your own.
3. Deploy to your own Cloudflare account.

## License

MIT
