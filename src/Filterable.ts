import { Nullable, Types } from 'javascriptutilities';

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

/// Global filterables that do not have any filter. Use this for filterable
/// types that bypass all.
export interface GlobalFilterableType<T> extends FilterableType<T> {

  /**
   * This method is used to check whether some object is global filterable.
   */
  markGlobalFilterable(): void;
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
    
    if (inclusive !== undefined && inclusive !== null) {
      let filters = inclusive;
      return objects.filter(value => filters.every(filter => filter(value)));
    } else {
      return objects.filter(value => !exclusive.some(filter => filter(value)));
    }
  }

  /**
   * Check whether some object is global filterable.
   * @param {*} obj An object of any type.
   * @returns {obj is GlobalFilterableType<T>} 
   */
  export function isGlobalFilterable<T>(obj: any): obj is GlobalFilterableType<T> {
    return Types.isInstance(obj, ['markGlobalFilterable']);
  }
}