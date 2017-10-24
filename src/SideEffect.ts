import { Try } from 'javascriptutilities';

export type SideEffect<T> = (t: T) => void;

export namespace SideEffects {
  
  /**
   * Apply side effects to an object. This function may throw an Error if any
   * of the side effect throws an Error, or the original object is not available.
   * @param  {T|Try<T>} original The original object.
   * @param  {SideEffect<T>[]} sideEffects An Array of side effects.
   */
  export function applySideEffects<T>(
    original: T | Try<T>,
    sideEffects: SideEffect<T>[]
  ) {
    let value = Try.success(original).getOrThrow();
    sideEffects.forEach(sideEffect => sideEffect(value));
  }
}