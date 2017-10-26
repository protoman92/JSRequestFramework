import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';
import { MiddlewareFilterableType as Filterable } from './Middleware';
import { RequestGenerator } from './RequestGenerator';
import { ResultProcessor } from './ResultProcessor'; 

/// Classes that implement this interface should specify the request type and
/// the type of execution result. They should be fully capable of handling all
/// requests of that particular type.
///
/// Their internal implementations should include request executors/processors.
export interface RequestHandlerType<Req extends Filterable,Res> {

  /**
   * Perform a request and process the result into some type.
   * @param  {Try<Req>} previous The result of the previous operation.
   * @param  {RequestGenerator<Prev,Req>} generator A RequestGenerator instance.
   * @param  {ResultProcessor<Res,Res2>} processor A ResultProcessor instance.
   * @returns Observable An Observable instance.
   */
  request<Prev,Res2>(
    previous: Try<Prev>,
    generator: RequestGenerator<Prev,Req>,
    processor: ResultProcessor<Res,Res2>
  ): Observable<Try<Res2>>;
}
