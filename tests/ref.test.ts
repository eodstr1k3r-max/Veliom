import { describe, it, expect } from 'vitest';
import { createRef, mergeRefs } from '../src/core/refs';

describe('Refs', () => {
  describe('createRef', () => {
    it('should create a ref with null current', () => {
      const ref = createRef<HTMLDivElement>();
      expect(ref.current).toBeNull();
    });

    it('should allow setting current', () => {
      const ref = createRef<HTMLDivElement>();
      const element = document.createElement('div');
      ref.current = element;
      expect(ref.current).toBe(element);
    });
  });

  describe('mergeRefs', () => {
    it('should merge multiple refs', () => {
      const ref1 = createRef<HTMLDivElement>();
      const ref2 = createRef<HTMLDivElement>();
      const merged = mergeRefs(ref1, ref2);

      const element = document.createElement('div');
      merged(element);

      expect(ref1.current).toBe(element);
      expect(ref2.current).toBe(element);
    });

    it('should handle callback refs', () => {
      const refCallback = vi.fn();
      const ref = createRef<HTMLDivElement>();
      const merged = mergeRefs(refCallback, ref);

      const element = document.createElement('div');
      merged(element);

      expect(refCallback).toHaveBeenCalledWith(element);
      expect(ref.current).toBe(element);
    });

    it('should handle null element', () => {
      const ref1 = createRef<HTMLDivElement>();
      const ref2 = createRef<HTMLDivElement>();
      const merged = mergeRefs(ref1, ref2);

      merged(null);

      expect(ref1.current).toBeNull();
      expect(ref2.current).toBeNull();
    });
  });
});
