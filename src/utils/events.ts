export function onClickOutside(
  element: Element | null,
  callback: () => void,
  enabled: boolean = true
): () => void {
  if (!enabled || !element) return () => {};

  const handler = (e: Event) => {
    if (!element.contains(e.target as Node)) {
      callback();
    }
  };

  document.addEventListener('click', handler, true);
  return () => document.removeEventListener('click', handler, true);
}
