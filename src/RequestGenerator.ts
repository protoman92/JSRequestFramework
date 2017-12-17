import { ReactiveResult, Try } from 'javascriptutilities';

export type RequestGenerator<Prev,Req> = (p: Try<Prev>) => ReactiveResult<Req>;

export namespace RequestGenerators {

  /**
   * Force generate a request by unwrapping the previous value.
   * @param {(previous:Prev) => ReactiveResult<Req>} generator generator function.
   * @returns {RequestGenerator<Prev,Req>} A RequestGenerator instance.
   */
  export function forceGn<Prev,Req>(
    generator: (previous: Prev) => ReactiveResult<Req>
  ): RequestGenerator<Prev,Req> {
    return previous => {
      try {
        let prev = previous.getOrThrow();
        return generator(prev);
      } catch (e) {
        return Try.failure(e);
      }
    };
  }
}