import { Nullable } from 'javascriptutilities';

export type Filter<T> = (value: T) => boolean;

/// Classes that implement this interface must specify filters that can be
/// used to filter (out) some generic type.
///
/// For example, Filterable<string> must have string filters.
export interface FilterableType<T> {
  
  /**
   * Inclusive filters. If this is declared, override exclusive filters.
   * @returns Nullable A nullable Array of filters.
   */
  inclusiveFilters(): Nullable<Filter<T>[]>;

  /**
   * Exclusive filters.
   * @returns Filter An Array of filters.
   */
  exclusiveFilters(): Filter<T>[];
}

export namespace Filterables {

  /**
   * Filter some objects based on a filterable.
   * @param  {U} filterable A FilterableType instance.
   * @param  {T[]} objects An Array of objects to be filtered.
   * @returns T[] An Array of filtered objects.
   */
  export function filter<T,U extends FilterableType<T>>(filterable: U, objects: T[]): T[] {
    let inclusive = filterable.inclusiveFilters();
    let exclusive = filterable.exclusiveFilters();
    
    if (inclusive !== undefined) {
      let filters = inclusive;
      return objects.filter(value => filters.every(filter => filter(value)));
    } else {
      return objects.filter(value => !exclusive.some(filter => filter(value)));
    }
  }
}