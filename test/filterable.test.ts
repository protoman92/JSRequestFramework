import { Nullable, Numbers } from 'javascriptutilities';
import { ErrorHolder, Filter, Filterables } from './../src';

describe('Filterable should be correct', () => {
  it('Filterables filter should work correctly for inclusive filters', () => {
    /// Setup
    let filterable = {
      inclusiveFilters: function(): Filter<number>[] {
        return [Numbers.isEven, value => (value + 1) % 3 === 0];
      },

      exclusiveFilters: function(): Filter<number>[] {
        return [Numbers.isOdd];
      }
    };

    let objects = [1, 2, 3, 4, 5, 6, 7, 8];

    /// When
    let filtered = Filterables.filter(filterable, objects);

    /// Then
    expect(filtered).toEqual([2, 8]);
  });

  it('Filterables filter should work correctly for exclusive filters', () => {
    /// Setup
    let filterable = {
      inclusiveFilters: function(): Nullable<Filter<number>[]> {
        return undefined;
      },

      exclusiveFilters: function(): Filter<number>[] {
        return [Numbers.isEven];
      }
    };

    let objects = Numbers.range(1, 100000);

    /// When
    let filtered = Filterables.filter(filterable, objects);

    /// Then
    expect(filtered.every(Numbers.isOdd)).toBeTruthy();
  });

  it('Checking global filterable should work correctly', () => {
    /// Setup
    let errorHolder = ErrorHolder.builder().build();

    /// When & Then
    expect(Filterables.isGlobalFilterable(errorHolder)).toBeTruthy();
  });
});