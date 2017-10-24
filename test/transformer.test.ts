import { Observable } from 'rxjs';
import 'javascriptutilities';
import { Transformer, Transformers } from './../src';

let timeout = 100;

describe('Transformers should work correctly', () => {
  it('Apply transformers should work', done => {
    /// Setup
    let tf1: Transformer<number> = value => value * 2;
    let tf2: Transformer<number> = value => value * 3;
    let tf3: Transformer<number> = value => value * 4;
    
    /// When & Then
    Transformers.applyTransformers(1, [tf1, tf2, tf3])
      .doOnNext(value => expect(value.value).toBe(24))
      .doOnCompleted(done)
      .subscribe();
  }, timeout);

  it('Apply transformers with error should throw said error', done => {
    try {
      /// Setup
      let tf1: Transformer<number> = value => value * 2;
      let tf2: Transformer<number> = value => value * 3;
      let tf3: Transformer<number> = () => Observable.throw('Error 1');

      /// When & Then
      Transformers.applyTransformers(1, [tf1, tf2, tf3])
        .doOnNext(value => expect(value.isFailure()).toBeTruthy())
        .doOnCompleted(done)
        .subscribe();
    } catch (e) {
      fail();
    }
  }, timeout);
});