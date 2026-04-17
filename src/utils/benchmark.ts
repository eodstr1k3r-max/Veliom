export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmup?: number;
}

const defaultOptions: Required<BenchmarkOptions> = {
  iterations: 1000,
  warmup: 10,
};

export function benchmark(
  name: string,
  fn: () => void,
  options: BenchmarkOptions = {}
): BenchmarkResult {
  const opts = { ...defaultOptions, ...options };
  const times: number[] = [];

  for (let i = 0; i < opts.warmup; i++) {
    fn();
  }

  for (let i = 0; i < opts.iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / opts.iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSecond = 1000 / avgTime;

  return {
    name,
    iterations: opts.iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    opsPerSecond,
  };
}

export function compareBenchmarks(
  ...benchmarks: BenchmarkResult[]
): void {
  console.log('\n┌─────────────────────────────────────────────────────────────┐');
  console.log('│                     BENCHMARK RESULTS                       │');
  console.log('├──────────────┬──────────┬───────────┬───────────┬────────────┤');
  console.log('│ Name         │ Ops/sec  │ Avg (μs)  │ Min (μs)  │ Max (μs)   │');
  console.log('├──────────────┼──────────┼───────────┼───────────┼────────────┤');
  
  for (const result of benchmarks) {
    console.log(
      `│ ${result.name.padEnd(12)} │ ${result.opsPerSecond.toFixed(0).padStart(8)} │ ${(result.avgTime * 1000).toFixed(2).padStart(9)} │ ${(result.minTime * 1000).toFixed(2).padStart(9)} │ ${(result.maxTime * 1000).toFixed(2).padStart(10)} │`
    );
  }
  
  console.log('└──────────────┴──────────┴───────────┴───────────┴────────────┘\n');

  if (benchmarks.length > 1) {
    const fastest = benchmarks.reduce((a, b) => 
      a.opsPerSecond > b.opsPerSecond ? a : b
    );
    console.log(`Fastest: ${fastest.name} (${fastest.opsPerSecond.toFixed(0)} ops/sec)\n`);
  }
}

export function runPerformanceTests(): void {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    VELIOM PERFORMANCE TESTS                     ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const results: BenchmarkResult[] = [];

  results.push(benchmark('Signal Get', () => {
    const s = { value: 42, get: () => 42 };
    for (let i = 0; i < 1000; i++) s.get();
  }, { iterations: 500 }));

  results.push(benchmark('Signal Set', () => {
    const listeners: (() => void)[] = [];
    let value = 0;
    const set = (v: number) => { value = v; listeners.forEach(l => l()); };
    for (let i = 0; i < 100; i++) set(i);
  }, { iterations: 500 }));

  results.push(benchmark('VNode Create', () => {
    const h = (type: string, props: Record<string, unknown> = {}, ...children: unknown[]) => ({ type, props, children });
    for (let i = 0; i < 100; i++) {
      h('div', { className: 'container' },
        h('span', { id: 'item' }, 'text'),
        h('button', undefined, 'Click')
      );
    }
  }, { iterations: 500 }));

  results.push(benchmark('Array Map', () => {
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 100; i++) {
      arr.map(x => x * 2);
    }
  }, { iterations: 500 }));

  compareBenchmarks(...results);
}
