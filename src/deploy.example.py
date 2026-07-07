"""
Example: deploy an ES-module Cloudflare Worker via the API. SKELETON only.
Env: CF_ACCOUNT_ID, CF_API_TOKEN, WORKER_NAME, WORKER_SCRIPT_PATH
"""
import os, sys, json, pathlib, urllib.request, urllib.error
ACCT  = os.environ["CF_ACCOUNT_ID"]
TOKEN = os.environ["CF_API_TOKEN"]
NAME  = os.environ.get("WORKER_NAME", "sovereign-mcp")
SCRIPT = pathlib.Path(os.environ.get("WORKER_SCRIPT_PATH", "src/server.js")).read_text()
metadata = { "main_module": "server.js", "compatibility_date": "2025-01-01" }
b = "----sovereignmcp"
body = (
    f"--{b}\r\nContent-Disposition: form-data; name=\"metadata\"; filename=\"metadata.json\"\r\n"
    f"Content-Type: application/json\r\n\r\n{json.dumps(metadata)}\r\n"
    f"--{b}\r\nContent-Disposition: form-data; name=\"server.js\"; filename=\"server.js\"\r\n"
    f"Content-Type: application/javascript+module\r\n\r\n{SCRIPT}\r\n--{b}--\r\n"
).encode()
req = urllib.request.Request(
    f"https://api.cloudflare.com/client/v4/accounts/{ACCT}/workers/scripts/{NAME}",
    data=body, method="PUT",
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": f"multipart/form-data; boundary={b}"})
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        print("deploy:", r.status, r.read()[:300].decode(errors="replace"))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read()[:300].decode(errors="replace")); sys.exit(1)
