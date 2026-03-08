// PHASE 9: Performance Hardening Utilities
// Optimization patterns and memoization helpers

import { useMemo, useCallback, useRef, useEffect, useState } from "react";

/**
 * Debounced state setter - delays state updates to reduce re-renders
 * Useful for hover handlers, input changes, window resizes
 */
export const useDebouncedState = (initialValue, delay = 150) => {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef(null);

  const setDebouncedValue = useCallback(
    (newValue) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setValue(typeof newValue === "function" ? newValue(value) : newValue);
      }, delay);
    },
    [value, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return [value, setDebouncedValue];
};

/**
 * Memoized array/object selector with equality checking
 * Prevents unnecessary re-renders when data hasn't changed
 */
export const useMemoizedSelector = (selector, dependencies = []) => {
  return useMemo(() => selector(), dependencies);
};

/**
 * Batch multiple state updates into single re-render
 * Use for complex component state management
 */
export const useBatchedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const batchRef = useRef({});

  const setBatched = useCallback((updates) => {
    Object.assign(batchRef.current, updates);
    setState((prev) => ({ ...prev, ...batchRef.current }));
    batchRef.current = {};
  }, []);

  return [state, setBatched];
};

/**
 * Virtual list row renderer for large tables
 * Renders only visible rows to improve performance
 */
export const renderTableRowsVirtually = (
  rows,
  rowHeight,
  containerHeight,
  scrollTop,
) => {
  const startIndex = Math.floor(scrollTop / rowHeight);
  const visibleRowCount = Math.ceil(containerHeight / rowHeight);
  const endIndex = Math.min(startIndex + visibleRowCount + 1, rows.length);

  return {
    visibleRows: rows.slice(startIndex, endIndex),
    offsetY: startIndex * rowHeight,
    totalHeight: rows.length * rowHeight,
  };
};

/**
 * Memoized filter/sort operations on arrays
 * Prevents recalculation unless source data changes
 */
export const useMemoizedSort = (items, sortFn, deps = []) => {
  return useMemo(() => {
    return [...items].sort(sortFn);
  }, [items, ...deps]);
};

/**
 * Intersection Observer hook for lazy-loading content
 * Tracks when elements enter viewport
 */
export const useIntersectionObserver = (options = {}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, ...options },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [options]);

  return [elementRef, isVisible];
};

/**
 * Memoized class name builder
 * Prevents CSS class string regeneration
 */
export const useMemoizedClass = (
  baseClass,
  conditionalClasses = {},
  deps = [],
) => {
  return useMemo(() => {
    const classes = [baseClass];
    Object.entries(conditionalClasses).forEach(([cls, condition]) => {
      if (condition) classes.push(cls);
    });
    return classes.join(" ");
  }, [baseClass, conditionalClasses, ...deps]);
};

/**
 * Request animation frame debouncer for smooth updates
 * Aligns state updates with browser refresh rate (60fps)
 */
export const useRAF = (callback) => {
  const rafRef = useRef(null);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(callback);
  }, [callback]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return scheduleUpdate;
};

export default {
  useDebouncedState,
  useMemoizedSelector,
  useBatchedState,
  renderTableRowsVirtually,
  useMemoizedSort,
  useIntersectionObserver,
  useMemoizedClass,
  useRAF,
};
