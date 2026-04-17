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
export declare function benchmark(name: string, fn: () => void, options?: BenchmarkOptions): BenchmarkResult;
export declare function compareBenchmarks(...benchmarks: BenchmarkResult[]): void;
export declare function runPerformanceTests(): void;
//# sourceMappingURL=benchmark.d.ts.map