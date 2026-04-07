type FloatingDialogOptions = {
  initialLeft: number;
  initialTop: number;
  margin?: number;
};

class FloatingDialogSupport {
  private static nextZIndex = 80;
  private static readonly cards = new Set<HTMLElement>();
  private static initialized = false;

  static attach(
    shell: HTMLElement | null,
    card: HTMLElement | null,
    handle: HTMLElement | null,
    options: FloatingDialogOptions
  ): void {
    if (!shell || !card || !handle) return;
    if ((card as any).__floatingDialogAttached) return;
    (card as any).__floatingDialogAttached = true;

    card.dataset.dialogInitialLeft = String(options.initialLeft);
    card.dataset.dialogInitialTop = String(options.initialTop);
    card.dataset.dialogMargin = String(options.margin ?? 12);
    card.dataset.dialogPositioned = "false";
    FloatingDialogSupport.cards.add(card);
    FloatingDialogSupport.ensureInitialized();

    const bringToFront = () => FloatingDialogSupport.bringToFront(shell);
    card.addEventListener("pointerdown", bringToFront);

    handle.classList.add("dialog-drag-handle");
    handle.addEventListener("pointerdown", (ev: PointerEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target?.closest("button, a, input, select, textarea, label")) return;
      if (ev.pointerType !== "touch" && ev.button !== 0) return;

      ev.preventDefault();
      bringToFront();

      const rect = card.getBoundingClientRect();
      const offsetX = ev.clientX - rect.left;
      const offsetY = ev.clientY - rect.top;

      const onMove = (moveEv: PointerEvent) => {
        moveEv.preventDefault();
        FloatingDialogSupport.positionCard(
          card,
          moveEv.clientX - offsetX,
          moveEv.clientY - offsetY
        );
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    });
  }

  static show(shell: HTMLElement | null, card: HTMLElement | null): void {
    if (!shell || !card) return;
    shell.classList.add("show");
    shell.setAttribute("aria-hidden", "false");
    FloatingDialogSupport.ensurePosition(card);
    FloatingDialogSupport.bringToFront(shell);
  }

  static hide(shell: HTMLElement | null): void {
    if (!shell) return;
    shell.classList.remove("show");
    shell.setAttribute("aria-hidden", "true");
  }

  private static ensureInitialized(): void {
    if (FloatingDialogSupport.initialized) return;
    FloatingDialogSupport.initialized = true;
    window.addEventListener("resize", () => {
      FloatingDialogSupport.cards.forEach((card: HTMLElement) => {
        FloatingDialogSupport.ensurePosition(card);
      });
    });
  }

  private static ensurePosition(card: HTMLElement): void {
    if (card.dataset.dialogPositioned !== "true") {
      const left = Number(card.dataset.dialogInitialLeft ?? 24);
      const top = Number(card.dataset.dialogInitialTop ?? 96);
      FloatingDialogSupport.positionCard(card, left, top);
      return;
    }

    const left = Number(card.style.left.replace("px", "")) || 0;
    const top = Number(card.style.top.replace("px", "")) || 0;
    FloatingDialogSupport.positionCard(card, left, top);
  }

  private static positionCard(card: HTMLElement, left: number, top: number): void {
    const margin = Math.max(8, Number(card.dataset.dialogMargin ?? 12));
    const maxLeft = Math.max(margin, window.innerWidth - card.offsetWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - card.offsetHeight - margin);
    const clampedLeft = Math.min(Math.max(margin, left), maxLeft);
    const clampedTop = Math.min(Math.max(margin, top), maxTop);

    card.style.left = `${clampedLeft}px`;
    card.style.top = `${clampedTop}px`;
    card.dataset.dialogPositioned = "true";
  }

  private static bringToFront(shell: HTMLElement): void {
    shell.style.zIndex = String(++FloatingDialogSupport.nextZIndex);
  }
}
