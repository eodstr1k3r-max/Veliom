export function longestIncreasingSubsequence(keys: number[]): number[] {
  const n = keys.length;
  if (n === 0) return [];

  const tailIdx: number[] = [];
  const prev: number[] = new Array(n).fill(-1);

  for (let i = 0; i < n; i++) {
    const key = keys[i];
    let lo = 0;
    let hi = tailIdx.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (keys[tailIdx[mid]] < key) lo = mid + 1;
      else hi = mid;
    }
    if (lo === tailIdx.length) {
      tailIdx.push(i);
    } else {
      tailIdx[lo] = i;
    }
    if (lo > 0) prev[i] = tailIdx[lo - 1];
  }

  const result: number[] = [];
  let idx = tailIdx[tailIdx.length - 1];
  while (idx !== -1) {
    result.unshift(idx);
    idx = prev[idx];
  }
  return result;
}
