import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';

export type Transformed<T> = T | Observable<T>;
export type Transformer<T> = (t: T) => Transformed<T | Try<T>>;

export namespace Transformers {
  
  /**
   * Apply transformers to an object.
   * @param {T|Try<T>} original The original object.
   * @param {Transformer<T>[]} transformers An Array of transformers.
   * @returns {Observable<Try<T>>} An Observable instance.
   */
  export function applyTransformers<T>(
    original: T | Try<T>, transformers: Transformer<T>[],
  ): Observable<Try<T>> {
    let unwrapped = Try.unwrap(original, 'Object not available'); 
    var chain = Observable.of(unwrapped);
    
    for (let transformer of transformers) {
      chain = chain.flatMap(value => {
        try {
          let previous = value.getOrThrow();
          let transformed = transformer(previous);

          if (transformed instanceof Observable) {
            return transformed
              .map(v => Try.unwrap(v, 'Transformed not available'))
              .catchJustReturn(e => Try.failure<T>(e));
          } else {
            let result = Try.unwrap(transformed, 'Transformed not available');
            return Observable.of(result);
          }
        } catch (e) {
          return Observable.of(Try.failure<T>(e));
        }
      });
    }

    return chain;
  }
}