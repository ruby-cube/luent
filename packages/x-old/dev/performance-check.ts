
export type PerformanceCheck = {
    start: (name: string) => void;
    end: () => void
}


export function usePerformanceCheck() {
    let startTime: number;
    let name: string;
    return {
        start(name: string) {
            startTime = performance.now();
            name = name;
        },
        end() {
            const endTime = performance.now();
            const duration = endTime - startTime;
            if (duration > 10) console.warn(`Tasks for ${name} took ${duration}ms to run. This is potentially renderblocking. Aim for 3-4 ms`)
        }
    }
}