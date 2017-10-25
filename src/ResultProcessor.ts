import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';

export type ResultProcessor<Res1,Res2> = (r: Res1) => Observable<Try<Res2>>;

export namespace ResultProcessors {

  /**
   * Return exactly what is passed in.
   * @returns ResultProcessor A ResultProcessor instance.
   */
  export function eq<T>(): ResultProcessor<T,T> {
    return value => Observable.of(Try.success(value));
  }
}