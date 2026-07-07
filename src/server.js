/**
 * sovereign-mcp — MCP server scaffold (Cloudflare Worker, ES module).
 * Template only. Placeholder tools; two-layer auth on tools/call.
 * Env: MCP_ORIGIN_SECRET, ACCESS_TEAM_DOMAIN, ACCESS_AUD
 */
const PROTOCOL_VERSION = "2025-06-18";

const TOOLS = [
  { name: "example_echo", description: "Placeholder. Returns your text.",
    inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] } },
  { name: "example_add", description: "Placeholder. Adds two numbers.",
    inputSchema: { type: "object", properties: { a: { type: "number" }, b: { type: "number" } }, required: ["a","b"] } },
];

async function runTool(name, args) {
  switch (name) {
    case "example_echo": return { echoed: String(args?.text ?? "") };
    case "example_add":  return { sum: Number(args?.a ?? 0) + Number(args?.b ?? 0) };
    default: throw new Error("unknown tool: " + name);
  }
}

function bearerOk(request, env) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return !!(m && env.MCP_ORIGIN_SECRET && m[1] === env.MCP_ORIGIN_SECRET);
}
async function edgeIdentityOk(request) {
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
  return !!jwt; // scaffold: presence only. Verify signature + AUD in production.
}
function rpc(id, result, error) { const b={jsonrpc:"2.0",id}; if(error)b.error=error; else b.result=result; return b; }

async function handleMethod(msg, request, env) {
  const { id, method, params } = msg;
  switch (method) {
    case "initialize":
      return rpc(id, { protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
        capabilities: { tools: {} }, serverInfo: { name: "sovereign-mcp-scaffold", version: "0.1.0" } });
    case "tools/list": return rpc(id, { tools: TOOLS });
    case "tools/call": {
      if (!bearerOk(request, env) || !(await edgeIdentityOk(request, env)))
        return rpc(id, null, { code: -32001, message: "unauthorized" });
      try {
        const out = await runTool(params?.name, params?.arguments || {});
        return rpc(id, { content: [{ type: "text", text: JSON.stringify(out) }] });
      } catch (e) { return rpc(id, null, { code: -32000, message: String(e?.message || e) }); }
    }
    case "ping": return rpc(id, {});
    default: return rpc(id, null, { code: -32601, message: "method not found" });
  }
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("sovereign-mcp scaffold", { status: 200 });
    let body; try { body = await request.json(); } catch { return json(400, { error: "bad json" }); }
    const messages = Array.isArray(body) ? body : [body];
    const results = [];
    for (const msg of messages) results.push(await handleMethod(msg, request, env));
    return json(200, results.length === 1 ? results[0] : results);
  },
};
function json(status, obj){ return new Response(JSON.stringify(obj), { status, headers:{ "content-type":"application/json" } }); }
