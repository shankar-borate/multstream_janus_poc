export class Dom {

  /**
   * Required element lookup
   * Throws clear error if element not found
   */
  static get<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);

    if (!el) {
      throw new Error(`[DOM] Element not found: #${id}`);
    }

    return el as T;
  }

  /**
   * Optional element lookup (no throw)
   */
  static tryGet<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }

  /**
   * Show element
   */
  static show(el: HTMLElement) {
    el.style.display = "";
  }

  /**
   * Hide element
   */
  static hide(el: HTMLElement) {
    el.style.display = "none";
  }

  /**
   * Toggle visibility
   */
  static toggle(el: HTMLElement, visible: boolean) {
    el.style.display = visible ? "" : "none";
  }

  /**
   * Set text safely
   */
  static setText(el: HTMLElement, text: string) {
    el.textContent = text;
  }

  /**
   * Add class helper
   */
  static addClass(el: HTMLElement, cls: string) {
    el.classList.add(cls);
  }

  /**
   * Remove class helper
   */
  static removeClass(el: HTMLElement, cls: string) {
    el.classList.remove(cls);
  }
}