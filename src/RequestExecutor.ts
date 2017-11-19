import { Observable } from 'rxjs';
import { BuildableType, BuilderType, Try } from 'javascriptutilities';
import * as ErrorHolder from './ErrorHolder';
import * as MiddlewareManager from './MiddlewareManager';
import { RequestType } from './Request';
import { RequestGenerator } from './RequestGenerator';
import { RequestPerformer } from './RequestPerformer';

export function builder<Req extends RequestType>(): Builder<Req> {
  return new Builder();
}

export interface Type<Req extends RequestType> {

  /**   
   * Generate a request based on some previous result and execute it.
   * @param  {Try<Prev>} previous
   * @param  {RequestGenerator<Prev,Req>} generator
   * @param  {RequestPerformer<Req,Res>} perform
   * @returns Observable An Observable instance.
   */
  execute<Prev,Res>(
    previous: Try<Prev>, 
    generator: RequestGenerator<Prev,Req>,
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>>;
}

/// This class is used to execute requests. The associated generic specifies
/// the type of request to be executed.
export class Self<Req extends RequestType> implements BuildableType<Builder<Req>>, Type<Req> {
  errMiddlewareManager?: MiddlewareManager.Type<ErrorHolder.Self>;
  rqMiddlewareManager?: MiddlewareManager.Type<Req>;

  public builder = (): Builder<Req> => {
    return builder();
  }

  public cloneBuilder = (): Builder<Req> => {
    return this.builder().withBuildable(this);
  }

  /**
   * Generate a request object based on the previous result.
   * @param  {Try<Prev>} previous Previous result.
   * @param  {RequestGenerator<Prev,Req>} generator Request generator.
   * @returns Observable An Observable instance.
   */
  public request<Prev>(
    previous: Try<Prev>, 
    generator: RequestGenerator<Prev,Req>
  ): Observable<Try<Req>> {
    try {
      let request = generator(previous);

      if (request instanceof Observable) {
        return request.catchJustReturn(e => Try.failure(e));
      } else {
        return Observable.of(Try.success(request));
      }
    } catch (e) {
      return Observable.of(Try.failure(e));
    }
  }

  /**
   * Actually perform a request.
   * @param  {Req} request The request to be performed.
   * @param  {RequestPerformer<Req,Res>} perform A RequestPerformer instance.
   * @returns Observable An Observable instance.
   */
  private performActual<Res>(
    request: Req, 
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>> {
    try {
      let res = perform(request);
      
      if (res instanceof Observable) {
        let retries = request.requestRetries();
        return res.retry(retries).catchJustReturn(e => Try.failure(e));
      } else {
        return Observable.of(Try.success(res));
      }
    } catch (e) {
      return Observable.of(Try.failure(e));
    }
  }

  /**
   * Apply middlewares and perform a request.
   * @param  {Try<Req>} request The request to be performed.
   * @param  {RequestPerformer<Req,Res>} perform A RequestPerformer instance.
   * @returns Observable An Observable instance.
   */
  public perform<Res>(
    request: Try<Req>, 
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>> {
    try {
      let req = request.getOrThrow();
      this.applyErrorMiddlewares;

      return this.applyRequestMiddlewares(req)
        .map(req => req.getOrThrow())
        .flatMap(req => this.performActual(req, perform))
        .catch(e => this.applyErrorMiddlewares(request, e))
        .catchJustReturn(e => Try.failure<Res>(e));
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
  public execute<Prev,Res>(
    previous: Try<Prev>,
    generator: RequestGenerator<Prev,Req>,
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>> {
    return this.request(previous, generator)
      .flatMap(request => this.perform(request, perform));
  }

  /**
   * Apply request middlewares.
   * @param  {Req} request The request to apply middlewares to.
   * @returns Observable An Observable instance.
   */
  private applyRequestMiddlewares = (request: Req): Observable<Try<Req>> => {
    let manager = this.rqMiddlewareManager;

    if (manager !== undefined) {
      return manager.applyMiddlewares(request);
    } else {
      return Observable.of(Try.success(request));
    }
  }

  /**
   * Apply error middlewares.
   * @param  {Req} request The request to apply middlewares to.
   * @returns Observable An Observable instance.
   */
  private applyErrorMiddlewares<Res>(request: Try<Req>, error: Error): Observable<Try<Res>> {
    let manager = this.errMiddlewareManager;

    if (manager !== undefined) {
      let description = request.map(value => value.requestDescription()).value;

      let newError: ErrorHolder.Self;

      if (error instanceof ErrorHolder.Self) {
        newError = ErrorHolder.builder()
          .withBuildable(error)
          .withRequestDescription(description)
          .build();
      } else {
        newError = ErrorHolder.builder()
          .withRequestDescription(description)
          .withOriginalError(error)
          .build();
      }

      return manager.applyMiddlewares(newError)
        .map(e => e.getOrThrow())
        .map(e => Try.failure<Res>(e))
        .catchJustReturn(e => Try.failure<Res>(e));
    } else {
      return Observable.of(Try.failure<Res>(error));
    }
  }
}

export class Builder<Req extends RequestType> implements BuilderType<Self<Req>> {
  private executor: Self<Req>;

  constructor() {
    this.executor = new Self();  
  }

  /**
   * Set the error middleware manager.
   * @param  {MiddlewareManager.Type<ErrorHolder.Self>} manager? A MiddlewareManager
   * instance.
   * @returns this The current Builder instance.
   */
  public withErrorMiddlewareManager(
    manager?: MiddlewareManager.Type<ErrorHolder.Self>
  ): this {
    this.executor.errMiddlewareManager = manager;
    return this;
  }

  /**
   * Set the request middleware manager.
   * @param  {MiddlewareManager<Req>} manager? A MiddlewareManager instance.
   * @returns this The current Builder instance.
   */
  public withRequestMiddlewareManager = (manager?: MiddlewareManager.Type<Req>): this => {
    this.executor.rqMiddlewareManager = manager;
    return this;
  }

  public withBuildable = (buildable?: Self<Req>): this => {
    if (buildable != undefined) {
      return this
        .withErrorMiddlewareManager(buildable.errMiddlewareManager)
        .withRequestMiddlewareManager(buildable.rqMiddlewareManager);
    } else {
      return this;
    }
  }

  public build = (): Self<Req> => {
    return this.executor;
  }
}