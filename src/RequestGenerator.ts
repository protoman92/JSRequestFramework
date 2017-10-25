import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';

export type RequestGenerator<Prev,Req> = (p: Try<Prev>) => Req | Try<Req> | Observable<Try<Req>>; 

export namespace RequestGenerators {

  /**
   * Force generate a request by unwrapping the previous value.
   * @param  {(previous:Prev)=>Try<Req>|Observable<Try<Req>>} generator A
   * generator function.
   * @returns RequestGenerator A RequestGenerator instance.
   */
  export function forceGn<Prev,Req>(
    generator: (previous: Prev) =>  Req | Try<Req> | Observable<Try<Req>>
  ): RequestGenerator<Prev,Req> {
    return previous => {
      try {
        let prev = previous.getOrThrow();
        return generator(prev);
      } catch (e) {
        return Observable.of(Try.failure(e));
      }
    };
  }
}