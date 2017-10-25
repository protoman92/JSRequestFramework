import { Observable } from 'rxjs';
import { BuildableType, BuilderType, Try } from 'javascriptutilities';
import * as MiddlewareManager from './MiddlewareManager';
import { RequestType } from './Request';
import { RequestGenerator } from './RequestGenerator';
import { RequestPerformer } from './RequestPerformer';

export function builder<Req extends RequestType>(): Builder<Req> {
  return new Builder();
}

/// This class is used to execute requests. The associated generic specifies
/// the type of request to be executed.
export class Self<Req extends RequestType> implements BuildableType<Builder<Req>> {
  requestMiddlewareManager?: MiddlewareManager.Self<Req>;

  public builder(): Builder<Req> {
    return builder();
  }

  public cloneBuilder(): Builder<Req> {
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
        return request.catchJustReturn(value => Try.failure(value));
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
   * @param  {RequestPerformer<Req} perform A RequestPerformer instance.
   * @returns Observable An Observable instance.
   */
  private performActual<Res>(
    request: Req, 
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>> {
    try {
      let res = perform(request);
      
      if (res instanceof Observable) {
        return res.catchJustReturn(value => Try.failure(value));
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
   * @param  {RequestPerformer<Req} perform A RequestPerformer instance.
   * @returns Observable An Observable instance.
   */
  public perform<Res>(
    request: Try<Req>, 
    perform: RequestPerformer<Req,Res>
  ): Observable<Try<Res>> {
    try {
      let req = request.getOrThrow();

      return this.applyRequestMiddlewares(req)
        .map(req => req.getOrThrow())
        .flatMap(req => this.performActual(req, perform))
        .catchJustReturn(value => Try.failure(value));
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
  private applyRequestMiddlewares(request: Req): Observable<Try<Req>> {
    let manager = this.requestMiddlewareManager;

    if (manager !== undefined) {
      let rqManager = manager;

      return rqManager.applyTransformers(request)
        .doOnNext(value => value.map(rqManager.applySideEffects))
        .catchJustReturn(value => Try.failure(value));
    } else {
      return Observable.of(Try.success(request));
    }
  }
}

export class Builder<Req extends RequestType> implements BuilderType<Self<Req>> {
  private executor: Self<Req>;

  constructor() {
    this.executor = new Self();  
  }

  /**
   * Set the request middleware manager.
   * @param  {MiddlewareManager<Req>} manager? A MiddlewareManager instance.
   * @returns this The current Builder instance.
   */
  public withRequestMiddlewareManager(manager?: MiddlewareManager.Self<Req>): this {
    this.executor.requestMiddlewareManager = manager;
    return this;
  }

  public withBuildable(buildable?: Self<Req>): this {
    if (buildable != undefined) {
      return this.withRequestMiddlewareManager(buildable.requestMiddlewareManager);
    } else {
      return this;
    }
  }

  public build(): Self<Req> {
    return this.executor;
  }
}