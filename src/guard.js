/**
 * Default-deny command guard. Run every shell command through this BEFORE
 * execution. Starter denylist — extend with your own threat model.
 */
const DENY_PATTERNS = [
  /\brm\s+-[a-z]*r[a-z]*f\b/i,           // destructive recursive delete
  /\bmkfs(\.[a-z0-9]+)?\b/i,          // filesystem-format tools
  /\bdd\b.*\bof=\/dev\//i,             // block-device overwrite
  /:\(\)\{.*\|:&\};:/,                  // fork bomb
  /\b(shutdown|reboot|halt|poweroff)\b/i,
  /\|\s*(sh|bash|zsh|python[0-9.]*|node|perl|ruby)\b/i,
  /\bcurl\b.*\|\s*(sh|bash)/i,
  /\bwget\b.*\|\s*(sh|bash)/i,
  /\beval\b/i,
  /\bsudo\s+su\b/i,
  /\bsudo\s+-i\b/i,
  /\bcrontab\s+-r\b/i,
];
const SECRET_FILE_PATTERNS = [
  /\.env(\b|[^a-zA-Z0-9])/i, /\.secrets?\b/i, /\/vault\b/i,
  /\.pem\b/i, /\.key\b/i, /id_rsa\b/i,
  /\btoken\b.*=.*['"]/i, /\.aws\/credentials/i, /\.git-credentials/i,
];
const READ_VERBS = /^\s*(cat|less|more|head|tail|grep|awk|sed|base64|xxd|od|strings|cp|mv|scp|rsync)\b/i;

export function guardCommand(cmd) {
  const s = String(cmd || "");
  if (!s.trim()) return { ok: false, reason: "empty command" };
  for (const p of DENY_PATTERNS) if (p.test(s)) return { ok: false, reason: "blocked by allowlist (destructive pattern)" };
  if (READ_VERBS.test(s)) for (const p of SECRET_FILE_PATTERNS) if (p.test(s)) return { ok: false, reason: "blocked by allowlist (secret-file read)" };
  return { ok: true };
}
