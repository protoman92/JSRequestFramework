import { ReactiveResult, Try } from 'javascriptutilities';

export type ResultProcessor<Res1, Res2> = (r: Res1) => ReactiveResult<Res2>;

export namespace ResultProcessors {

  /**
   * Return exactly what is passed in.
   * @returns {ResultProcessor<T,T>} A ResultProcessor instance.
   */
  export function eq<T>(): ResultProcessor<T,T> {
    return value => Try.success(value);
  }
}