import { Observable } from 'rxjs';
import { Try } from 'javascriptutilities';

import {
  MiddlewareManager,
  RequestExecutor,
  RequestGenerator,
  RequestGenerators,
  RequestPerformer,
  RequestPerformers
} from './../src';

import * as TestRequest from './TestRequest';

let timeout = 100;

describe('Request executor should be correct', () => {
  let executor = RequestExecutor.builder<TestRequest.Self>().build();

  it('Previous failure should propagate error', done => {
    /// Setup
    let request = TestRequest.builder().build();
    let previous = Try.failure('Error 1');
    let generator = RequestGenerators.forceGn(() => request); 
    let perform = RequestPerformers.eq<TestRequest.Self>();
    let nextCount = 0;

    /// When & Then
    executor.execute(previous, generator, perform)
      .doOnNext(v => expect(v.isFailure()).toBeTruthy())
      .doOnNext(value => expect(value.error).toEqual(new Error('Error 1')))
      .doOnNext(() => nextCount += 1)
      .doOnError(fail)
      .doOnCompleted(() => expect(nextCount).toBe(1))
      .doOnCompleted(done)
      .subscribe();
  }, timeout);

  it('Request generator fails with Observable - should propagate error', done => {
    /// Setup
    let previous = Try.success({});
    let perform = RequestPerformers.eq<TestRequest.Self>();
    let nextCount = 0;

    let generator: RequestGenerator<any,TestRequest.Self> = () => {
      return Observable.error<Try<TestRequest.Self>>('Error 1');
    };

    /// When & Then
    executor.execute(previous, generator, perform)
      .doOnNext(v => expect(v.isFailure()).toBeTruthy())
      .doOnNext(value => expect(value.error).toEqual(new Error('Error 1')))
      .doOnNext(() => nextCount += 1)
      .doOnError(fail)
      .doOnCompleted(() => expect(nextCount).toBe(1))
      .doOnCompleted(done)
      .subscribe();
  }, timeout);

  it('Request generator fails - should propagate error', done => {
    /// Setup
    let previous = Try.success({});
    let perform = RequestPerformers.eq<TestRequest.Self>();
    let nextCount = 0;

    let generator: RequestGenerator<any,TestRequest.Self> = () => {
      throw new Error('Error 1');
    };

    /// When & Then
    executor.execute(previous, generator, perform)
      .doOnNext(v => expect(v.isFailure()).toBeTruthy())
      .doOnNext(value => expect(value.error).toEqual(new Error('Error 1')))
      .doOnNext(() => nextCount += 1)
      .doOnError(fail)
      .doOnCompleted(() => expect(nextCount).toBe(1))
      .doOnCompleted(done)
      .subscribe();
  }, timeout);

  it('Generator fails with multiple requests - should propagate error', done => {
    /// Setup
    let requestCount = 100;
    let previous = Try.success({});

    let generator: RequestGenerator<any,TestRequest.Self> = () => {
      return Observable.range(0, requestCount)
        .flatMap(i => Observable.of(Try.failure(`Error ${i}`)));
    };

    let perform: RequestPerformer<TestRequest.Self,void> = () => Observable.empty();

    let nextCount = 0;

    /// When & Then
    executor.execute(previous, generator, perform)
      .doOnNext(v => expect(v.isFailure()).toBeTruthy())
      .doOnNext(() => nextCount += 1)
      .doOnError(fail)
      .doOnCompleted(() => expect(nextCount).toBe(requestCount))
      .doOnCompleted(done)
      .subscribe();
  }, timeout);

  it('Request performer fails - should propagate error', done => {
    /// Setup
    let requestCount = 100;
    let previous = Try.success({});
    let nextCount = 0;

    let generator = RequestGenerators.forceGn(() => {
      return Observable.range(0, requestCount)
        .map(() => Try.success(TestRequest.builder().build()));
    });

    let perform: RequestPerformer<TestRequest.Self,void> = () => {
      throw new Error('Error 1');
    };

    /// When & Then
    executor.execute(previous, generator, perform)
      .doOnNext(v => expect(v.isFailure()).toBeTruthy())
      .doOnNext(value => expect(value.error).toEqual(new Error('Error 1')))
      .doOnNext(() => nextCount += 1)
      .doOnError(fail)
      .doOnCompleted(() => expect(nextCount).toBe(requestCount))
      .doOnCompleted(done)
      .subscribe();
  }, timeout);

  it('Middleware fails - should propagate error', done => {
    /// Setup
    let request = TestRequest.builder().build();
    let previous = Try.success({});
    let generator = RequestGenerators.forceGn(() => request);
    let perform = RequestPerformers.eq<TestRequest.Self>();
    let nextCount = 0;

    let mwManager = MiddlewareManager.builder<TestRequest.Self>()
      .addGlobalTransform(() => { throw Error('Error 1'); })
      .addTransform(value => value, 'TF1')
      .addSideEffect(console.log, 'SE1')
      .build();

    let executor2 = executor.cloneBuilder()
      .withRequestMiddlewareManager(mwManager)
      .build();

    /// When
    executor2.execute(previous, generator, perform)
      .doOnNext(v => expect(v.isFailure()).toBeTruthy())
      .doOnNext(value => expect(value.error).toEqual(new Error('Error 1')))
      .doOnNext(() => nextCount += 1)
      .doOnError(fail)
      .doOnCompleted(done)
      .subscribe();
  }, timeout);

  it('Perform fails - should trigger retry', done => {
    /// Setup
    let retries = 10;
    let retried = 0;

    let request = TestRequest.builder()
      .withRequestRetries(retries)
      .build();

    let previous = Try.success({});
    let generator = RequestGenerators.forceGn(() => request);

    let perform: RequestPerformer<TestRequest.Self,void> = () => {
      return Observable.error<Try<void>>('Error 1').doOnError(() => retried += 1);
    };

    /// When & Then
    executor.execute(previous, generator, perform)
      .doOnNext(value => expect(value.error).toEqual(new Error('Error 1')))
      .doOnError(fail)

      // Need to add 1 to retries because the first attempt is not counted
      // as part of the retry count.
      .doOnCompleted(() => expect(retried).toBe(retries + 1))
      .doOnCompleted(done)
      .subscribe();
  });
});