/**
 * MBT Platform Security Suite
 * Centralized sanitization, validation, SQL injection prevention, and XSS protection.
 */

// HTML entity map for escaping
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escapes characters to prevent Cross-Site Scripting (XSS) in HTML outputs & emails.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  const s = String(str);
  return s.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strips HTML tags and script elements completely.
 */
export function stripHtmlTags(str: unknown): string {
  if (str === null || str === undefined) return "";
  let clean = String(str);
  // Remove null bytes
  clean = clean.replace(/\0/g, "");
  // Remove script and style tags with content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  // Remove inline on* handlers and javascript: pseudos
  clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  clean = clean.replace(/on\w+\s*=\s*[^\s>]+/gi, "");
  // Strip remaining HTML tags
  clean = clean.replace(/<[^>]*>/g, "");
  return clean;
}

/**
 * Sanitizes generic user text input.
 * Strips HTML, null bytes, control characters, and trims.
 */
export function sanitizeText(val: unknown, maxLength: number = 2000): string {
  if (val === null || val === undefined) return "";
  let text = stripHtmlTags(val);
  // Remove ASCII control characters except standard whitespace (newline, tab)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  text = text.trim();
  if (maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength);
  }
  return text;
}

/**
 * Known SQL Injection patterns (PostgreSQL & standard SQL)
 */
const SQLI_PATTERNS = [
  /(\b(union(\s+all)?)\s+select\b)/i,
  /(\bselect\b.+\bfrom\b)/i,
  /(\binsert\s+into\b)/i,
  /(\bupdate\b.+\bset\b)/i,
  /(\bdelete\s+from\b)/i,
  /(\bdrop\s+(table|database|view|column)\b)/i,
  /(\balter\s+table\b)/i,
  /(\btruncate\s+table\b)/i,
  /(;\s*--)/i,
  /(--\s*$)/m,
  /(\/\*[\w\W]*?\*\/)/,
  /(\b(exec|execute)\s*\(.*\))/i,
  /(\b(pg_sleep|waitfor\s+delay|benchmark)\b)/i,
  /('\s*or\s*['"0-9a-zA-Z]+\s*=\s*['"0-9a-zA-Z]+)/i,
  /("\s*or\s*['"0-9a-zA-Z]+\s*=\s*['"0-9a-zA-Z]+)/i,
  /(\bor\s+1\s*=\s*1\b)/i,
  /(\bor\s+'1'\s*=\s*'1'\b)/i,
  /(\band\s+1\s*=\s*0\b)/i,
];

/**
 * Detects if a string contains known SQL injection patterns.
 */
export function containsSqlInjection(val: unknown): boolean {
  if (typeof val !== "string") return false;
  // Check for null bytes
  if (val.includes("\0")) return true;
  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(val)) return true;
  }
  return false;
}

/**
 * Validates and sanitizes email addresses.
 * Prevents SMTP header injection (CRLF) and SQL injection characters.
 */
export function sanitizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  let clean = email.trim().toLowerCase();
  // Reject null bytes, newlines, carriage returns (header injection)
  if (/[\r\n\0]/.test(clean)) return null;
  // Disallow SQL comments or quote characters
  if (/['";<>]/.test(clean)) return null;
  // Strict standard email format check
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean) || clean.length > 254) {
    return null;
  }
  return clean;
}

/**
 * Validates and sanitizes phone numbers.
 */
export function sanitizePhone(phone: unknown): string | null {
  if (typeof phone !== "string") return null;
  const clean = phone.trim();
  // Allow international format: +123 456-7890, (123) 456-7890, digits
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,20}$/;
  if (!phoneRegex.test(clean)) {
    return null;
  }
  return clean;
}

/**
 * Validates and sanitizes safe URLs.
 * Strictly permits only HTTP and HTTPS schemes.
 * Rejects javascript:, data:, vbscript:, file:, etc.
 */
export function sanitizeUrl(rawUrl: unknown): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject dangerous protocols even if obfuscated (e.g. java\tscript, &colon;)
  const normalized = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, "");
  if (/^(javascript|data|vbscript|file|blob):/i.test(normalized)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    // Return sanitized URL string
    return parsed.href;
  } catch {
    // If not a full URL or invalid format, return null
    return null;
  }
}

/**
 * Helper to get a safe URL for rendering in JSX <a href="...">.
 * If invalid or dangerous, returns undefined to prevent click execution.
 */
export function getSafeHref(url: unknown): string | undefined {
  const safe = sanitizeUrl(url);
  return safe || undefined;
}

/**
 * Validates a positive integer ID (e.g. database serial primary keys).
 */
export function sanitizePositiveInt(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const num = typeof val === "number" ? val : parseInt(String(val).trim(), 10);
  if (!Number.isInteger(num) || num <= 0 || isNaN(num) || !Number.isFinite(num)) {
    return null;
  }
  return num;
}

/**
 * Sanitizes input used in PostgREST text matching (ilike / like).
 * Strips unescaped PostgREST special wildcard symbols (% and _) and operator syntax.
 */
export function sanitizePostgrestFilter(term: unknown): string {
  if (typeof term !== "string") return "";
  let clean = term.trim();
  // Remove PostgREST filter operator characters to prevent filter tree manipulation
  clean = clean.replace(/[,()"\\]/g, "");
  // Escape or remove wildcards
  clean = clean.replace(/[%_]/g, "");
  return clean;
}

/**
 * Whitelist validator.
 */
export function validateWhitelist<T extends string>(
  val: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (typeof val === "string" && allowed.includes(val as T)) {
    return val as T;
  }
  return fallback;
}
