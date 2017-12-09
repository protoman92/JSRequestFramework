import { Observable } from 'rxjs';

import { Try } from 'javascriptutilities';

import {
  RequestExecutor, 
  RequestGenerators, 
  RequestPerformers,
  RequestProcessor,
  ResultProcessor,
  ResultProcessors
} from './../src';

import * as TestRequest from './TestRequest';

describe('Request processor\'s executor should be correct', () => {
  let processor = RequestProcessor.builder().build();

  /// Use this function to test executors.
  function testFailureExecutorWhileAllOthersAreCorrect(
    executor: RequestExecutor.Type<TestRequest.Self>, 
    errorMessage: string,
    done: any
  ) {
    /// Setup
    let newProcessor = processor.cloneBuilder()
      .withExecutor(executor)
      .build();

    let previous = Try.success({});
    let request = TestRequest.builder().build();
    let generator = RequestGenerators.forceGn(() => request);
    let perform = RequestPerformers.eq<TestRequest.Self>();
    let process = ResultProcessors.eq<TestRequest.Self>();
    let nextCount = 0;

    /// When & Then
    newProcessor.process(previous, generator, perform, process)
      .doOnNext(() => nextCount += 1)
      .doOnNext(value => expect(value.isFailure()).toBeTruthy())
      .doOnNext(value => expect(value.error).toEqual(new Error(errorMessage)))
      .doOnCompleted(() => expect(nextCount).toBe(1))
      .doOnCompleted(done)
      .subscribe();
  }

  it('Executor throw error while executing - should propagate error', done => {
    /// Setup
    let executor: RequestExecutor.Type<TestRequest.Self> = {
      execute: () => { throw Error('Error 1'); }
    };

    /// When & Then
    testFailureExecutorWhileAllOthersAreCorrect(executor, 'Error 1', done);
  });

  it('Execute fails - should propagate error', done => {
    /// Setup
    let executor: RequestExecutor.Type<TestRequest.Self> = {
      execute: () => Observable.error('Error 1')
    };

    /// When & Then
    testFailureExecutorWhileAllOthersAreCorrect(executor, 'Error 1', done);
  });
});

describe('Request processor\'s processing should be correct', () => {
  let processor = RequestProcessor.builder().build();

  function testFailureProcessingWhileAllOthersAreCorrect(
    process: ResultProcessor<TestRequest.Self,TestRequest.Self>,
    errorMessage: string,
    done: any
  ) {
    /// Setup
    let request = TestRequest.builder().build();

    let newProcessor = processor.cloneBuilder()
      .withExecutor({
        execute: (_previous, _generator, perform) => {
          let result = perform(request);
          
          if (result instanceof Observable) {
            return result.map(value => Try.unwrap(value));
          } else {
            return Observable.of(Try.unwrap(result));
          }
        }
      })
      .build();

    let previous = Try.success({});
    let generator = RequestGenerators.forceGn(() => request);
    let perform = RequestPerformers.eq<TestRequest.Self>();
    let nextCount = 0;

    /// When & Then
    newProcessor.process(previous, generator, perform, process)
      .doOnNext(() => nextCount += 1)
      .doOnNext(value => expect(value.error).toEqual(new Error(errorMessage)))
      .doOnError(fail)
      .doOnCompleted(() => expect(nextCount).toBe(1))
      .doOnCompleted(done)
      .subscribe();
  }

  it('Processing throws error - should propagate error', done => {
    let process = () => { throw new Error('Error 1'); };
    testFailureProcessingWhileAllOthersAreCorrect(process, 'Error 1', done);
  });

  it('Processing fails = should propagate error', done => {
    let process = () => Observable.error<Try<TestRequest.Self>>('Error 1');
    testFailureProcessingWhileAllOthersAreCorrect(process, 'Error 1', done);
  });
});