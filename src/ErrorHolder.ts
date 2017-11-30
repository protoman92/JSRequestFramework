import { BuildableType, BuilderType, Nullable } from 'javascriptutilities';
import { Filter, GlobalFilterableType } from './Filterable';

export function builder(): Builder {
  return new Builder();
}

export class Type {
  requestDescription: Nullable<string>;

  originalError: Nullable<Error>;
}

/// Use this class to intercept request errors.
export class Self implements 
  BuildableType<Builder>, 
  Error, 
  GlobalFilterableType<string>, 
  Type
{
  requestDescription: Nullable<string>;
  originalError: Nullable<Error>;

  public get name(): string {
    let error = this.originalError;
    return error !== undefined && error !== null ? error.name : "";
  }

  public get message(): string {
    let error = this.originalError;
    return error !== undefined && error !== null ? error.message : "";
  }

  public get stack(): string | undefined {
    let error = this.originalError;
    return error !== undefined && error != null ? error.stack : undefined;
  }

  public builder = (): Builder => {
    return builder();
  }

  public cloneBuilder = (): Builder => {
    return this.builder().withBuildable(this);
  }

  public inclusiveFilters = (): Nullable<Filter<string>[]> => {
    return undefined;
  }

  public exclusiveFilters = (): Filter<string>[] => {
    return [];
  }

  public markGlobalFilterable = () => {};

  public toString = (): string => {
    return `${this.requestDescription}: ${this.originalError}`;
  }
}

export class Builder implements BuilderType<Self> {
  private error: Self;

  constructor() {
    this.error = new Self();
  }

  /**
   * Set the request description.
   * @param  {string} description? A string value.
   * @returns this The current Builder instance.
   */
  public withRequestDescription = (description: Nullable<string>): this => {
    this.error.requestDescription = description;
    return this;
  }

  /**
   * Set the original error.
   * @param  {Error} error? An Error instance.
   * @returns this The current Builder instance.
   */
  public withOriginalError = (error: Nullable<Error>): this => {
    this.error.originalError = error;
    return this;
  }

  public withBuildable = (buildable: Self): this => {
    if (buildable !== undefined) {
      return this
        .withRequestDescription(buildable.requestDescription)
        .withOriginalError(buildable.originalError);
    } else {
      return this;
    }
  }

  public build = (): Self => {
    return this.error;
  }
}