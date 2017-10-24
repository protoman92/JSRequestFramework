import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';

export type RequestGenerator<Prev,Req> = (p: Try<Prev>) => Observable<Try<Req>>; 
export type RequestPerformer<Req,Res> = (r: Req) => Observable<Try<Res>>;
export type ResultProcessor<Res1,Res2> = (r: Res1) => Observable<Try<Res2>>;

export class RequestExecutor {

  /**
   * Generate a request object based on the previous result.
   * @param  {Try<Prev>} previous Previous result.
   * @param  {RequestGenerator<Prev,Req>} generator Request generator.
   * @returns Observable An Observable instance.
   */
  public request<Prev,Req>(
    previous: Try<Prev>, 
    generator: RequestGenerator<Prev,Req>
  ): Observable<Try<Req>> {
    try { 
      return generator(previous);
    } catch (e) {
      return Observable.of(Try.failure(e));
    }
  }

  /**
   * Perform a request.
   * @param  {Try<Req>} request The request to be perform.
   * @param  {RequestPerformer<Req} perform A RequestPerformer instance.
   * @returns Observable An Observable instance.
   */
  public perform<Req,Res>(
    request: Try<Req>, 
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>> {
    try {
      let req = request.getOrThrow();
      return perform(req);
    } catch (e) {
      return Observable.of(Try.failure(e));
    }
  }

  /**
   * Generate a request based on some previous result and execute it.
   * @param  {Try<Prev>} previous
   * @param  {RequestGenerator<Prev,Req>} generator
   * @param  {RequestPerformer<Req,Res>} perform
   * @returns Observable An Observable instance.
   */
  public execute<Prev,Req,Res>(
    previous: Try<Prev>,
    generator: RequestGenerator<Prev,Req>,
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>> {
    return this.request(previous, generator)
      .flatMap(request => this.perform(request, perform));
  }
}