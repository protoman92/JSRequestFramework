import { SideEffect } from './SideEffect';
import { Transformer } from './Transformer';
import { FilterableType } from './Filterable';

export class Middleware<T> {
  public readonly identifier: string;
  public readonly middleware: T;

  public constructor(identifier: string, middleware: T) {
    this.identifier = identifier;
    this.middleware = middleware;
  }
}

export type SideEffectMiddleware<T> = Middleware<SideEffect<T>>;
export type TransformMiddleware<T> = Middleware<Transformer<T>>;
export type MiddlewareFilterableType = FilterableType<string>;