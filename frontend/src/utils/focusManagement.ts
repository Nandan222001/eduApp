export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('hidden') && el.offsetParent !== null
  );
};

export const getFirstFocusableElement = (container: HTMLElement): HTMLElement | null => {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[0] : null;
};

export const getLastFocusableElement = (container: HTMLElement): HTMLElement | null => {
  const elements = getFocusableElements(container);
  return elements.length > 0 ? elements[elements.length - 1] : null;
};

export const focusElement = (element: HTMLElement | null, options?: FocusOptions): boolean => {
  if (!element) return false;

  try {
    element.focus(options);
    return document.activeElement === element;
  } catch (error) {
    console.error('Failed to focus element:', error);
    return false;
  }
};

export const restoreFocus = (
  previousElement: HTMLElement | null,
  fallbackElement?: HTMLElement | null
): void => {
  if (previousElement && document.body.contains(previousElement)) {
    focusElement(previousElement);
  } else if (fallbackElement && document.body.contains(fallbackElement)) {
    focusElement(fallbackElement);
  } else {
    document.body.focus();
  }
};

export const lockBodyScroll = (): (() => void) => {
  const scrollY = window.scrollY;
  const body = document.body;

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';

  return () => {
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    window.scrollTo(0, scrollY);
  };
};

export const isElementInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const scrollIntoViewIfNeeded = (
  element: HTMLElement,
  options?: ScrollIntoViewOptions
): void => {
  if (!isElementInViewport(element)) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
      ...options,
    });
  }
};

export const createFocusWatcher = (callback: (focused: boolean) => void): (() => void) => {
  const handleFocus = () => callback(true);
  const handleBlur = () => callback(false);

  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);

  return () => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
  };
};

export const disableTabIndexTemporarily = (container: HTMLElement): (() => void) => {
  const focusableElements = getFocusableElements(container);
  const originalTabIndexes = new Map<HTMLElement, string | null>();

  focusableElements.forEach((element) => {
    originalTabIndexes.set(element, element.getAttribute('tabindex'));
    element.setAttribute('tabindex', '-1');
  });

  return () => {
    focusableElements.forEach((element) => {
      const original = originalTabIndexes.get(element);
      if (original === null) {
        element.removeAttribute('tabindex');
      } else if (original !== undefined) {
        element.setAttribute('tabindex', original);
      }
    });
  };
};
