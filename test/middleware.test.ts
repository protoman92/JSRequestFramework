import { Nullable } from 'javascriptutilities';
import { 
  ErrorHolder, 
  Filter, 
  MiddlewareFilterableType, 
  MiddlewareManager 
} from './../src';

describe('Middleware manager should be correct', () => {
  it('Global middlewares should bypass filters', () => {
    /// Setup
    let globalId = MiddlewareManager.Self.globalMWIdentifier;
    let external = 1;

    class Filterable implements MiddlewareFilterableType {
      value: number;

      constructor() {
        this.value = 0;
      }

      mapValue(f: (value: number) => number): this {
        this.value = f(this.value);
        return this;
      }

      inclusiveFilters(): Nullable<Filter<string>[]> {
        return undefined;
      }

      exclusiveFilters(): Filter<string>[] {
        return [
          value => value === 'TF1', 
          value => value === 'SE2',
          value => value === globalId
        ];
      }
    }

    let manager = MiddlewareManager.builder<Filterable>()
      .addGlobalTransform(value => value.mapValue(v => v * 2))
      .addGlobalSideEffect(value => external += value.value)
      .addTransform(value => value.mapValue(v => v + 1), 'TF1')
      .addTransform(value => value.mapValue(v => v + 2), 'TF2')
      .addSideEffect(value => external *= value.value, 'SE1')
      .addSideEffect(console.log, 'SE2')
      .build();

    let filterable = new Filterable();

    /// When
    let transforms = manager.filterTransforms(filterable);
    let sideEffects = manager.filterSideEffects(filterable);

    /// Then
    let tfIds = transforms.map(value => value.identifier);
    let seIds = sideEffects.map(value => value.identifier);
    expect(tfIds).toEqual([globalId, 'TF2']);
    expect(seIds).toEqual([globalId, 'SE1']);
  });

  it('Global filterables should bypass all filters', done => {
    /// Setup
    let external = '';

    let manager = MiddlewareManager.builder<ErrorHolder.Self>()
      .addTransform(e => e.cloneBuilder().withRequestDescription('TF1').build(), 'TF1')
      .addSideEffect(e => external += e.requestDescription || "", 'SE1')
      .build();

    let original = ErrorHolder.builder().build();

    /// When & Then
    manager.applyMiddlewares(original)
      .doOnNext(e => expect(e.getOrThrow().requestDescription).toBe('TF1'))
      .doOnError(fail)
      .doOnCompleted(() => expect(external).toBe('TF1'))
      .doOnCompleted(done)
      .subscribe();
  });
});