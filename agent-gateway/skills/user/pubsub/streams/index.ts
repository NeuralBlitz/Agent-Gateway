export interface AsyncIterator<T> {
  next(): Promise<IteratorResult<T>>;
}

export class Stream<T> {
  constructor(private source: AsyncIterable<T>) {}

  static from<T>(source: T[]): Stream<T> {
    return new Stream({
      [Symbol.asyncIterator]: () => ({
        index: 0,
        source,
        next() {
          if (this.index < this.source.length) {
            return Promise.resolve({ done: false, value: this.source[this.index++] });
          }
          return Promise.resolve({ done: true, value: undefined as any });
        },
      }),
    });
  }

  async map<U>(fn: (item: T) => U | Promise<U>): Promise<U[]> {
    const results: U[] = [];
    for await (const item of this.source) {
      results.push(await fn(item));
    }
    return results;
  }

  async filter(fn: (item: T) => boolean | Promise<boolean>): Promise<T[]> {
    const results: T[] = [];
    for await (const item of this.source) {
      if (await fn(item)) {
        results.push(item);
      }
    }
    return results;
  }

  async reduce<U>(fn: (acc: U, item: T) => U | Promise<U>, initial: U): Promise<U> {
    let acc = initial;
    for await (const item of this.source) {
      acc = await fn(acc, item);
    }
    return acc;
  }

  async find(fn: (item: T) => boolean | Promise<boolean>): Promise<T | undefined> {
    for await (const item of this.source) {
      if (await fn(item)) {
        return item;
      }
    }
    return undefined;
  }

  async some(fn: (item: T) => boolean | Promise<boolean>): Promise<boolean> {
    for await (const item of this.source) {
      if (await fn(item)) {
        return true;
      }
    }
    return false;
  }

  async every(fn: (item: T) => boolean | Promise<boolean>): Promise<boolean> {
    for await (const item of this.source) {
      if (!(await fn(item))) {
        return false;
      }
    }
    return true;
  }

  async take(n: number): Promise<T[]> {
    const results: T[] = [];
    let count = 0;
    for await (const item of this.source) {
      if (count >= n) break;
      results.push(item);
      count++;
    }
    return results;
  }

  async skip(n: number): Promise<T[]> {
    const results: T[] = [];
    let count = 0;
    for await (const item of this.source) {
      if (count >= n) {
        results.push(item);
      }
      count++;
    }
    return results;
  }

  async first(): Promise<T | undefined> {
    for await (const item of this.source) {
      return item;
    }
    return undefined;
  }

  async last(): Promise<T | undefined> {
    let last: T | undefined;
    for await (const item of this.source) {
      last = item;
    }
    return last;
  }

  async forEach(fn: (item: T) => void | Promise<void>): Promise<void> {
    for await (const item of this.source) {
      await fn(item);
    }
  }

  async toArray(): Promise<T[]> {
    const results: T[] = [];
    for await (const item of this.source) {
      results.push(item);
    }
    return results;
  }

  flatMap<U>(fn: (item: T) => AsyncIterable<U> | Iterable<U>): Stream<U> {
    const outer = this.source;
    return new Stream({
      [Symbol.asyncIterator]: async function*() {
        for await (const item of outer) {
          const inner = await fn(item);
          for await (const innerItem of inner) {
            yield innerItem;
          }
        }
      },
    });
  }

  async pipe<U>(...fns: ((stream: Stream<T>) => Stream<U>)[]): Promise<U[]> {
    let stream: any = this;
    for (const fn of fns) {
      stream = fn(stream);
    }
    return stream.toArray();
  }
}

export function range(start: number, end: number, step = 1): AsyncIterable<number> {
  return {
    [Symbol.asyncIterator]: () => ({
      current: start,
      end,
      step,
      next() {
        if (this.current < this.end) {
          const value = this.current;
          this.current += this.step;
          return Promise.resolve({ done: false, value });
        }
        return Promise.resolve({ done: true, value: undefined as any });
      },
    }),
  };
}

export function repeat<T>(value: T, times?: number): AsyncIterable<T> {
  let count = 0;
  return {
    [Symbol.asyncIterator]: () => ({
      next() {
        if (times !== undefined && count >= times) {
          return Promise.resolve({ done: true, value: undefined as any });
        }
        count++;
        return Promise.resolve({ done: false, value });
      },
    }),
  };
}

export function* iterate<T>(source: Iterable<T>): IterableIterator<T> {
  yield* source;
}

export function zip<T, U>(a: Iterable<T>, b: Iterable<U>): IterableIterator<[T, U]> {
  const iterA = a[Symbol.iterator]();
  const iterB = b[Symbol.iterator]();
  
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const resultA = iterA.next();
      const resultB = iterB.next();
      
      if (resultA.done || resultB.done) {
        return { done: true, value: undefined as any };
      }
      
      return { done: false, value: [resultA.value, resultB.value] };
    },
  };
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  
  for (const item of array) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  
  return [pass, fail];
}
