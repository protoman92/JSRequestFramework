import { ReactiveResult } from 'javascriptutilities';

export type RequestPerformer<Req,Res> = (r: Req) => ReactiveResult<Res>;

export namespace RequestPerformers {

  /**
   * Perform a request by returning exactly the request object.
   * @returns RequestPerformer A RequestPerformer instance.
   */
  export function eq<T>(): RequestPerformer<T,T> {
    return value => value;
  }
}