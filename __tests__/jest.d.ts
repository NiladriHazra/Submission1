/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveLength(length: number): R;
      toEqual(expected: any): R;
      toBe(expected: any): R;
      toContain(expected: any): R;
      toBeDefined(): R;
      toBeNull(): R;
      toHaveBeenCalled(): R;
      toHaveBeenCalledWith(...args: any[]): R;
      not: Matchers<R>;
    }
  }
}

export {};
