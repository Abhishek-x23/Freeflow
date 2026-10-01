import DOMPurify from 'dompurify';

/**
 * Strips script tags, onerror/onclick handlers, iframes, and dangerous attributes.
 * Works both in browser (using DOMPurify) and server environments (using regex sanitization fallback).
 */
export function sanitizeHtml(rawHtml: string | null | undefined): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  // Browser environment: DOMPurify with strict configuration
  if (typeof window !== 'undefined' && typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'b',
        'i',
        'em',
        'strong',
        'a',
        'p',
        'br',
        'span',
        'code',
        'pre',
        'ul',
        'ol',
        'li',
        'blockquote',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'img', 'svg'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
      FORCE_BODY: true,
      RETURN_DOM: false,
    });
  }

  // Server-side / isomorphic fallback:
  // Strip dangerous tags and attributes strictly
  let sanitized = rawHtml
    // Strip <script>...</script>
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip <iframe>...</iframe>
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Strip <img> tags entirely (which often carry onerror="...")
    .replace(/<img\b[^>]*>/gi, '')
    // Strip on* event handlers (onerror, onclick, onload, etc.)
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Strip javascript: URLs in href
    .replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"');

  return sanitized;
}

/**
 * Escapes plain text to prevent injection when rendering text directly
 */
export function escapeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
