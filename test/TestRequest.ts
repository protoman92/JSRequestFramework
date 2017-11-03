import { BuildableType, BuilderType, Nullable } from 'javascriptutilities';
import { Filter, RequestBuilderType, RequestType } from './../src';

export function builder(): Builder {
  return new Builder();
}

export class Self implements BuildableType<Builder>, RequestType {
  inclFilters: Filter<string>[];
  exclFilters: Filter<string>[];
  rqDescription?: string;
  retryCount: number;

  constructor() {
    this.inclFilters = [];
    this.exclFilters = [];
    this.retryCount = 1;
  }

  public builder = (): Builder => {
    return builder();
  }

  public cloneBuilder = (): Builder => {
    return this.builder().withBuildable(this);
  }

  public inclusiveFilters = (): Nullable<Filter<string>[]> => {
    let filters = this.inclFilters;
    return filters.length > 0 ? filters : undefined;
  }

  public exclusiveFilters = (): Filter<string>[] => {
    return this.exclFilters;
  }

  public requestDescription = (): string => {
    return this.rqDescription || "";
  }

  public requestRetries = (): number => {
    return this.retryCount;
  }
}

export class Builder implements BuilderType<Self>, RequestBuilderType {
  private request: Self;

  constructor() {
    this.request = new Self();
  }

  public withInclusiveFilters = (filters: Filter<string>[]): this => {
    this.request.inclFilters = filters;
    return this;
  }

  public withExclusiveFilters = (filters: Filter<string>[]): this => {
    this.request.exclFilters = filters;
    return this;
  }

  public withRequestDescription = (description?: string): this => {
    this.request.rqDescription = description;
    return this;
  }

  public withRequestRetries = (retries: number): this => {
    this.request.retryCount = retries;
    return this;
  }

  public withBuildable = (buildable?: Self): this => {
    if (buildable !== undefined) {
      return this
        .withInclusiveFilters(buildable.inclFilters)
        .withExclusiveFilters(buildable.exclFilters)
        .withRequestDescription(buildable.rqDescription)
        .withRequestRetries(buildable.retryCount);
    } else {
      return this;
    }
  }

  public build = (): Self => {
    return this.request;
  }
}