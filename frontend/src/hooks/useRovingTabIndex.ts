import { useState, useCallback, useEffect, useRef, KeyboardEvent } from 'react';

interface RovingTabIndexOptions {
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  onSelect?: (index: number) => void;
}

export const useRovingTabIndex = (
  itemCount: number,
  { orientation = 'vertical', loop = true, onSelect }: RovingTabIndexOptions = {}
) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  const focusItem = useCallback((index: number) => {
    const item = itemRefs.current[index];
    if (item) {
      item.focus();
      setActiveIndex(index);
    }
  }, []);

  const getNextIndex = useCallback(
    (currentIndex: number, direction: 'next' | 'prev') => {
      if (direction === 'next') {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= itemCount) {
          return loop ? 0 : currentIndex;
        }
        return nextIndex;
      } else {
        const prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          return loop ? itemCount - 1 : currentIndex;
        }
        return prevIndex;
      }
    },
    [itemCount, loop]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent, currentIndex: number) => {
      let handled = false;
      let newIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, 'next');
            handled = true;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, 'prev');
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, 'next');
            handled = true;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            newIndex = getNextIndex(currentIndex, 'prev');
            handled = true;
          }
          break;
        case 'Home':
          newIndex = 0;
          handled = true;
          break;
        case 'End':
          newIndex = itemCount - 1;
          handled = true;
          break;
        case 'Enter':
        case ' ':
          if (onSelect) {
            onSelect(currentIndex);
            handled = true;
          }
          break;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
        if (newIndex !== currentIndex) {
          focusItem(newIndex);
        }
      }
    },
    [orientation, itemCount, getNextIndex, focusItem, onSelect]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
      tabIndex: index === activeIndex ? 0 : -1,
      onKeyDown: (e: KeyboardEvent) => handleKeyDown(e, index),
      'aria-selected': index === activeIndex,
    }),
    [activeIndex, handleKeyDown]
  );

  return {
    activeIndex,
    setActiveIndex,
    getItemProps,
    focusItem,
  };
};

export default useRovingTabIndex;
