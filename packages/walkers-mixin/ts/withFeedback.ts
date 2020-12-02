export default function withFeedback<TOut, TIn>(iterator: AsyncGenerator<TOut, any, TIn>, feedback: TIn): AsyncGenerator<TOut, any, TIn> & { continue: TIn; } {
  const oldNext = iterator.next;

  const newIterator = iterator as AsyncGenerator<TOut, any, TIn> & { continue: TIn; };

  newIterator.continue = feedback;
  newIterator.next = () => {
    const result = oldNext.call(newIterator, newIterator.continue);
    newIterator.continue = feedback;
    return result;
  }

  return newIterator;
}
