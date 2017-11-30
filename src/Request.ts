import { Nullable } from 'javascriptutilities';
import { MiddlewareFilter, MiddlewareFilterableType } from './Middleware';

export interface RequestType extends MiddlewareFilterableType {

  /**
   * Get the request description.
   * @returns string A string value.
   */
  requestDescription(): string;

  /**
   * Get the number of retries for when the request fails.
   * @returns number A number value.
   */
  requestRetries(): number;
}

export interface RequestBuilderType {

  /**
   * Set inclusive middleware filters.
   * @param  {MiddlewareFilter} filters? An Array of MiddlewareFilter.
   * @returns this The current Builder instance.
   */
  withInclusiveFilters(filters: MiddlewareFilter[]): this;

  /**
   * Set Exclusive middleware filters.
   * @param  {MiddlewareFilter} filters? An Array of MiddlewareFilter.
   * @returns this The current Builder instance.
   */
  withExclusiveFilters(filters: MiddlewareFilter[]): this;

  /**
   * Set the request description.
   * @param  {string} description? A string value.
   * @returns this The current Builder instance.
   */
  withRequestDescription(description: Nullable<string>): this;

  /**
   * Set the request retry count.
   * @param  {number} retries A number value.
   * @returns this The current Builder instance.
   */
  withRequestRetries(retries: number): this;
}