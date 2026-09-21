export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string' || html.length === 0) return '';
  let out = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Strip event-handler attributes (onclick=, onerror=, ...) — quoted or unquoted.
  out = out.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Neutralize javascript:/data:text\/html/vbscript: URLs in href/src/action etc.
  out = out.replace(
    /\s(href|src|action|formaction|xlink:href)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attr: string, dq: string, sq: string, uq: string) => {
      const val = (dq ?? sq ?? uq ?? '').trim().toLowerCase();
      if (
        val.startsWith('javascript:') ||
        val.startsWith('vbscript:') ||
        val.startsWith('data:text/html')
      ) {
        return ` ${attr}="#"`;
      }
      return match;
    },
  );
  // Remove high-risk elements that can execute code or embed external content.
  out = out.replace(/<\s*(iframe|object|embed|link|meta|base|form)\b[^>]*>/gi, '');
  out = out.replace(/<\s*\/\s*(iframe|object|embed|link|meta|base|form)\s*>/gi, '');
  return out;
}
