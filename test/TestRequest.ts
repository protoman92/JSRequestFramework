import { BuildableType, BuilderType, Nullable } from 'javascriptutilities';
import { Filter, RequestType } from './../src';

export function builder(): Builder {
  return new Builder();
}

export class Self implements BuildableType<Builder>, RequestType {
  inclFilters: Filter<string>[];
  exclFilters: Filter<string>[];

  constructor() {
    this.inclFilters = [];
    this.exclFilters = [];
  }

  public builder(): Builder {
    return builder();
  }

  public cloneBuilder(): Builder {
    return this.builder().withBuildable(this);
  }

  public inclusiveFilters(): Nullable<Filter<string>[]> {
    let filters = this.inclFilters;
    return filters.length > 0 ? filters : undefined;
  }

  public exclusiveFilters(): Filter<string>[] {
    return this.exclFilters;
  }
}

export class Builder implements BuilderType<Self> {
  private request: Self;

  constructor() {
    this.request = new Self();
  }

  public withInclusiveFilters(inclusiveFilters: Filter<string>[]): this {
    this.request.inclFilters = inclusiveFilters;
    return this;
  }

  public withExclusiveFilters(exclusiveFilters: Filter<string>[]): this {
    this.request.exclFilters = exclusiveFilters;
    return this;
  }

  public withBuildable(buildable?: Self): this {
    if (buildable !== undefined) {
      return this
        .withInclusiveFilters(buildable.inclFilters)
        .withExclusiveFilters(buildable.exclFilters);
    } else {
      return this;
    }
  }

  public build(): Self {
    return this.request;
  }
}