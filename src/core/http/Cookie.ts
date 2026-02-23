class Cookie {
  /** Get cookie value by name (decoded). Returns null if missing. */
  static get(name: string): string | null {
    const safe = name.replace(/[-.$?*|{}()\[\]\\\/\+^]/g, "\\$&");
    const match = document.cookie.match(new RegExp(`(?:^|; )${safe}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
}
