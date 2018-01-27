export default function pipe<TIn>(input : AsyncIterableIterator<TIn> | PipableAsyncIterableIterator<TIn>) : PipableAsyncIterableIterator<TIn>
export default function pipe<TIn>(input : Iterable<TIn> | IterableIterator<TIn> | PipableIterableIterator<TIn>) : PipableIterableIterator<TIn>
export default function pipe<TIn>(input : Iterable<TIn> | IterableIterator<TIn> | PipableIterableIterator<TIn> | AsyncIterableIterator<TIn> | PipableAsyncIterableIterator<TIn>) : PipableIterableIterator<TIn> | PipableAsyncIterableIterator<TIn> {
  if(isPipable(input)){
    return input;
  }

  if(isAsync(input)){
    return {
      [Symbol.asyncIterator]() {
        return input[Symbol.asyncIterator]();
      },
      next(value?: any){
        return input.next(value);
      },
      return: input.return ? (value?: any) => (input.return as any)(value) : undefined,
      throw: input.throw ? (e?: any) => (input.throw as any)(e) : undefined,
      pipe<TOut>(next : (iterable : AsyncIterableIterator<TIn>) => AsyncIterableIterator<TOut>){
        return pipe(next(input));
      },
      then<TOut>(func : (iterable : AsyncIterableIterator<TIn>) => TOut) : TOut {
        return func(input);
      }
    };
  }

  if(isIterator(input)){
    return {
      [Symbol.iterator]() {
        return input[Symbol.iterator]();
      },
      next(value?: any){
        return input.next(value);
      },
      return: input.return ? (value?: any) => (input.return as any)(value) : undefined,
      throw: input.throw ? (e?: any) => (input.throw as any)(e) : undefined,
      pipe<TOut>(next : (iterable : IterableIterator<TIn>) => IterableIterator<TOut>) {
        return pipe(next(input));
      },
      map<TOut>(func : (iterable : IterableIterator<TIn>) => TOut) {
        return func(input);
      }
    };
  }

  return pipe(toIterableIterator(input));

}

function* toIterableIterator<T>(items : Iterable<T>) : IterableIterator<T> {
  yield* items;
}

type PipeAsync<TIn, TOut> = (<TOut>(next : (iterable : IterableIterator<TIn>) => IterableIterator<TOut>) => PipableIterableIterator<TOut>)
              | (<TOut>(next : (iterable : IterableIterator<TIn>) => AsyncIterableIterator<TOut>) => PipableAsyncIterableIterator<TOut>);

export interface PipableIterableIterator<TIn> extends IterableIterator<TIn> {
  pipe<TOut>(next : (iterable : IterableIterator<TIn>) => IterableIterator<TOut>) : PipableIterableIterator<TOut>
  map<TOut>(func : (iterable : IterableIterator<TIn>) => TOut) : TOut
}

export interface PipableAsyncIterableIterator<TIn> extends AsyncIterableIterator<TIn> {
  pipe<TOut>(next : (iterable : AsyncIterableIterator<TIn>) => AsyncIterableIterator<TOut>) : PipableAsyncIterableIterator<TOut>
  then<TOut>(func : (iterable : AsyncIterableIterator<TIn>) => TOut) : TOut
}

function isPipable<TIn>(input : Iterable<TIn> | IterableIterator<TIn> | PipableIterableIterator<TIn> | AsyncIterableIterator<TIn> | PipableAsyncIterableIterator<TIn>) : input is PipableIterableIterator<TIn> | PipableAsyncIterableIterator<TIn> {
  return 'pipe' in input;
}

function isAsync<TIn>(input : Iterable<TIn> | IterableIterator<TIn> | AsyncIterableIterator<TIn>) : input is AsyncIterableIterator<TIn> {
  return Symbol.asyncIterator in input;
}

function isIterator<TIn>(input : IterableIterator<TIn> | Iterable<TIn>) : input is IterableIterator<TIn> {
  return 'next' in input;
}