/**
 * URL validation utility to guard against XSS, javascript: protocols,
 * and malicious redirection schemes in attachment URLs.
 */
export function isSafeUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return false;
  }

  // Reject explicitly dangerous protocol patterns before URL constructor parse
  const lowercase = trimmed.toLowerCase();
  if (
    lowercase.startsWith('javascript:') ||
    lowercase.startsWith('data:') ||
    lowercase.startsWith('vbscript:') ||
    lowercase.startsWith('file:')
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Relative URLs or invalid URLs
    return false;
  }
}

/**
 * Returns safe href or '#' if unsafe.
 */
export function sanitizeAttachmentUrl(rawUrl: string | null | undefined): string | null {
  if (!isSafeUrl(rawUrl)) {
    return null;
  }
  return rawUrl ? rawUrl.trim() : null;
}
