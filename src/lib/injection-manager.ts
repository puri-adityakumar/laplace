/**
 * InjectionManager - Handles DOM injection for the Laplace toolbar button
 * 
 * This class manages:
 * - Finding and injecting the toolbar container into GitHub's PR page
 * - Watching for DOM changes (GitHub re-renders) and re-injecting if needed
 * - SPA navigation detection (URL changes)
 * - Dispatching events to notify React when container is ready
 * 
 * Why this exists:
 * GitHub's SPA re-renders sections of the page, destroying injected elements.
 * By keeping the observer logic outside React's lifecycle, we avoid race
 * conditions caused by useEffect cleanup during state changes.
 */

const CONTAINER_ID = 'laplace-toolbar-container';
const CONTAINER_READY_EVENT = 'laplace:container-ready';
const DEBOUNCE_MS = 200;
const MAX_RETRIES = 10;
const RETRY_INTERVAL_MS = 500;

// Toolbar selectors in priority order
const TOOLBAR_SELECTORS = [
  // Strategy 1: Modern PR comment form (Write/Preview tabs)
  { parent: '.js-previewable-comment-form .tabnav-tabs', marginLeft: 'auto' },
  // Strategy 2: CommentBox header
  { parent: '.CommentBox-header.tabnav .tabnav-tabs', marginLeft: 'auto' },
  // Strategy 3: Legacy toolbar (markdown formatting buttons)
  { parent: '.js-write-bucket .toolbar-commenting', marginLeft: '8px' },
  // Strategy 4: Legacy comment form toolbar
  { parent: '.comment-form-head .toolbar-commenting', marginLeft: '8px' },
];

class InjectionManager {
  private observer: MutationObserver | null = null;
  private isInjecting = false;
  private container: HTMLElement | null = null;
  private observerTarget: Element | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastUrl: string = '';
  private initialized = false;

  /**
   * Initialize the injection manager
   * Call this once when the content script loads
   */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    
    this.lastUrl = location.href;
    
    if (this.isPRPage()) {
      this.inject();
    }
    
    this.startWatching();
    
    // Listen for browser back/forward navigation
    window.addEventListener('popstate', () => this.handleUrlChange());
    
    console.log('[Laplace] InjectionManager initialized');
  }

  /**
   * Check if current page is a PR page
   */
  private isPRPage(): boolean {
    const path = window.location.pathname;
    return /\/pull\/\d+/.test(path) || path.includes('/compare/');
  }

  /**
   * Find the best element to observe (narrower scope = better performance)
   */
  private findObserverTarget(): Element {
    return document.querySelector('.js-previewable-comment-form')
        || document.querySelector('#discussion_bucket')
        || document.body;
  }

  /**
   * Attempt to inject the toolbar container
   * Guards against concurrent injection attempts
   */
  inject(): void {
    // Guard: prevent concurrent injection attempts
    if (this.isInjecting) {
      console.log('[Laplace] Injection already in progress, skipping');
      return;
    }

    // Guard: container already exists in DOM
    const existing = document.getElementById(CONTAINER_ID);
    if (existing) {
      console.log('[Laplace] Container already exists in DOM');
      this.container = existing;
      this.dispatchReadyEvent();
      return;
    }

    this.isInjecting = true;
    this.tryInject(0);
  }

  /**
   * Try to find toolbar and inject container, with retries
   */
  private tryInject(attempt: number): void {
    // Max retries reached
    if (attempt >= MAX_RETRIES) {
      console.log('[Laplace] Max injection attempts reached');
      this.isInjecting = false;
      return;
    }

    // Try each selector strategy
    for (const strategy of TOOLBAR_SELECTORS) {
      const toolbar = document.querySelector(strategy.parent);
      if (toolbar) {
        const container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.marginLeft = strategy.marginLeft;
        
        toolbar.appendChild(container);
        this.container = container;
        this.isInjecting = false;
        
        console.log('[Laplace] Container injected using selector:', strategy.parent);
        this.dispatchReadyEvent();
        return;
      }
    }

    // No toolbar found, retry after delay
    console.log(`[Laplace] Toolbar not found, retry ${attempt + 1}/${MAX_RETRIES}`);
    setTimeout(() => this.tryInject(attempt + 1), RETRY_INTERVAL_MS);
  }

  /**
   * Dispatch custom event to notify React that container is ready
   */
  private dispatchReadyEvent(): void {
    window.dispatchEvent(new CustomEvent(CONTAINER_READY_EVENT, {
      detail: { container: this.container }
    }));
    console.log('[Laplace] Dispatched container-ready event');
  }

  /**
   * Start watching for DOM changes that might remove our container
   * Also detects URL changes for SPA navigation
   */
  private startWatching(): void {
    if (this.observer) return;

    this.observerTarget = this.findObserverTarget();

    this.observer = new MutationObserver(() => {
      // Check for URL change (SPA navigation)
      const currentUrl = location.href;
      if (currentUrl !== this.lastUrl) {
        this.lastUrl = currentUrl;
        this.handleUrlChange();
        return;
      }

      // Guard: skip if we're currently injecting (prevents feedback loop)
      if (this.isInjecting) return;
      if (!this.isPRPage()) return;

      // Debounce to reduce CPU usage during rapid DOM changes
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        const existing = document.getElementById(CONTAINER_ID);
        
        if (!existing && this.container) {
          console.log('[Laplace] Container was removed, re-injecting...');
          this.container = null;
          this.restartWatching();
          this.inject();
        }
      }, DEBOUNCE_MS);
    });

    this.observer.observe(this.observerTarget, { 
      childList: true, 
      subtree: true 
    });

    console.log('[Laplace] DOM observer started on:', this.observerTarget.tagName || 'body');
  }

  /**
   * Handle URL change (SPA navigation)
   */
  private handleUrlChange(): void {
    console.log('[Laplace] URL changed to:', location.href);
    this.container = null;
    this.isInjecting = false;
    
    if (this.isPRPage()) {
      this.restartWatching();
      setTimeout(() => this.inject(), 500);
    }
  }

  /**
   * Restart the observer (needed when observed element is replaced)
   */
  private restartWatching(): void {
    // Start new observer before disconnecting old (no gap)
    const oldObserver = this.observer;
    this.observer = null;
    this.observerTarget = null;
    this.startWatching();
    oldObserver?.disconnect();
  }

  /**
   * Get the current container element
   */
  getContainer(): HTMLElement | null {
    // Verify container still exists in DOM
    if (this.container && !document.body.contains(this.container)) {
      this.container = null;
    }
    return this.container;
  }

  /**
   * Cleanup - disconnect observers and remove container
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.observerTarget = null;
    this.initialized = false;
    console.log('[Laplace] InjectionManager cleaned up');
  }
}

// Export singleton instance
export const injectionManager = new InjectionManager();

// Export event name for React to listen to
export { CONTAINER_READY_EVENT };
