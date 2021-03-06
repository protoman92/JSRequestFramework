import { Observable } from 'rxjs';
import { BuildableType, BuilderType, Nullable, Try } from 'javascriptutilities';
import { RequestGenerator } from './RequestGenerator';
import { RequestPerformer } from './RequestPerformer';
import { ResultProcessor } from './ResultProcessor';
import * as RequestExecutor from './RequestExecutor';
import { RequestType } from './Request';

export function builder<Req extends RequestType>(): Builder<Req> {
  return new Builder();
}

export interface Type<Req extends RequestType> {

  /**
   * Execute a request and process the result into some other type.
   * @param {Try<Prev>} previous The result of the previous operation.
   * @param {RequestGenerator<Prev,Req>} generator A RequestGenerator instance.
   * @param {RequestPerformer<Req,Res1>} perform A RequestPerformer instance.
   * @param {ResultProcessor<Res1,Res2>} processor A ResultProcessor instance.
   * @returns {Observable<Try<Res2>>} An Observable instance.
   */
  process<Prev,Res1,Res2>(
    previous: Try<Prev>,
    generator: RequestGenerator<Prev,Req>,
    perform: RequestPerformer<Req,Res1>,
    processor: ResultProcessor<Res1,Res2>,
  ): Observable<Try<Res2>>;
}

/// This class is used to process the result of some requests. This is done in
/// order to hide internal implementations of the requests being executed.
export class Self<Req extends RequestType> implements BuildableType<Builder<Req>>, Type<Req> {
  executor: Nullable<RequestExecutor.Type<Req>>;

  public builder = (): Builder<Req> => {
    return builder();
  }

  public cloneBuilder = (): Builder<Req> => {
    return this.builder().withBuildable(this);
  }

  /**
   * Process the result of a request into a specified type.
   * @param {Try<Res1>} result The result of a request.
   * @param {ResultProcessor<Res1,Res2>} process A ResultProcessor instance.
   * @returns {Observable<Try<Res2>>} An Observable instance.
   */
  private processResult<Res1,Res2>(
    result: Try<Res1>, process: ResultProcessor<Res1,Res2>,
  ): Observable<Try<Res2>> {
    try {
      let res1 = result.getOrThrow();
      let value = process(res1);

      if (value instanceof Observable) {
        return value.catchJustReturn(e => Try.failure<Res2>(e));
      } else {
        return Observable.of(Try.unwrap(value, 'Value not available'));
      }
    } catch (e) {
      return Observable.of(Try.failure<Res2>(e));
    }
  }

  /**
   * Execute a request and process the result into some other type.
   * @param {Try<Prev>} previous The result of the previous operation.
   * @param {RequestGenerator<Prev,Req>} generator A RequestGenerator instance.
   * @param {RequestPerformer<Req,Res1>} perform A RequestPerformer instance.
   * @param {ResultProcessor<Res1,Res2>} process A ResultProcessor instance.
   * @returns {Observable<Try<Res2>>} An Observable instance.
   */
  public process<Prev,Res1,Res2>(
    previous: Try<Prev>,
    generator: RequestGenerator<Prev,Req>,
    perform: RequestPerformer<Req,Res1>,
    process: ResultProcessor<Res1,Res2>,
  ): Observable<Try<Res2>> {
    let executor = this.executor;

    if (executor !== undefined && executor !== null) {
      try {
        return executor.execute(previous, generator, perform)
          .catchJustReturn(e => Try.failure<Res1>(e))
          .flatMap(value => this.processResult(value, process));
      } catch (e) {
        return Observable.of(Try.failure(e));
      }
    } else {
      return Observable.of(Try.failure('Executor cannot be nil'));
    }
  }
}

export class Builder<Req extends RequestType> implements BuilderType<Self<Req>> {
  private processor: Self<Req>;

  constructor() {
    this.processor = new Self();
  }

  /**
   * Set the request executor instance.
   * @param {Nullable<RequestExecutor.Type<Req>>} executor A RequestExecutor instance.
   * @returns {this} The current Builder instance.
   */
  public withExecutor = (executor: Nullable<RequestExecutor.Type<Req>>): this => {
    this.processor.executor = executor;
    return this;
  }

  public withBuildable = (buildable: Nullable<Self<Req>>): this => {
    if (buildable !== undefined && buildable !== null) {
      return this.withExecutor(buildable.executor);
    } else {
      return this;
    }
  }

  public build = (): Self<Req> => {
    return this.processor;
  }
}