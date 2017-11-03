import { Observable } from 'rxjs';
import { BuildableType, BuilderType, Try } from 'javascriptutilities';
import { Filterables } from './Filterable';

import {
  Middleware,
  SideEffectMiddleware,
  TransformMiddleware,
  MiddlewareFilterableType as Filterable,
} from './Middleware';

import { SideEffect, SideEffects } from './SideEffect';
import { Transformer, Transformers } from './Transformer';

export function builder<T extends Filterable>(): Builder<T> {
  return new Builder();
}

export interface Type<T extends Filterable> {

  /**
   * Apply middlewares.
   * @param  {T} obj The filterable object.
   * @returns Observable An Observable instance.
   */
  applyMiddlewares(obj: T): Observable<Try<T>>;
}

export class Self<T extends Filterable> implements BuildableType<Builder<T>>, Type<T> {

  /**
   * Get the global middleware identifier - which, if used to identify a
   * middleware, allows it to bypass all filters.
   * @returns string A string value.
   */
  public static get globalMWIdentifier(): string {
    return 'hp_global_middleware';
  }

  sideEffects: SideEffectMiddleware<T>[];
  transforms: TransformMiddleware<T>[];
 
  constructor() {
    this.sideEffects = [];
    this.transforms = [];
  }

  public builder = (): Builder<T> => {
    return builder();
  }

  public cloneBuilder = (): Builder<T> => {
    return this.builder().withBuildable(this);
  }

  /**
   * Filter out unnecessary middlewares.
   * @param  {T} obj The filterable object.
   * @param  {Middleware<any>[]} middlewares An Array of middleware wrappers.
   * @returns M An Array of middlewares.
   */
  public filterMiddlewares = (obj: T, middlewares: Middleware<any>[]): Middleware<any>[] => {
    if (Filterables.isGlobalFilterable(obj)) {
      return middlewares;
    } else {
      let globalId = Self.globalMWIdentifier; 
      let identifiers = middlewares.map(value => value.identifier);
      let filtered = Filterables.filter(obj, identifiers);

      let globalMiddlewares = middlewares
        .filter(value => value.identifier === globalId);
      
      let filteredMiddlewares = middlewares
        .filter(value => filtered.find(v => value.identifier === v) != undefined)
        .filter(value => value.identifier !== globalId);

      return globalMiddlewares.concat(filteredMiddlewares);
    }
  }

  public filterTransforms = (obj: T): TransformMiddleware<T>[] => {
    return this.filterMiddlewares(obj, this.transforms);
  }

  public filterSideEffects = (obj: T): SideEffectMiddleware<T>[] => {
    return this.filterMiddlewares(obj, this.sideEffects);
  }

  /**
   * Apply transform middlewares.
   * @param  {T} obj The filterable object.
   * @returns Observable An Observable instance.
   */
  public applyTransformers = (obj: T): Observable<Try<T>> => {
    let middlewares = this.filterTransforms(obj).map(value => value.middleware);
    return Transformers.applyTransformers(obj, middlewares);    
  }

  /**
   * Apply side effect middlewares.
   * @param  {T} obj The filterable object.
   */
  public applySideEffects = (obj: T): void => {
    let middlewares = this.filterSideEffects(obj).map(value => value.middleware);
    SideEffects.applySideEffects(obj, middlewares);
  }

  /**
   * Apply middlewares.
   * @param  {T} obj The filterable object.
   * @returns Observable An Observable instance.
   */
  public applyMiddlewares = (obj: T): Observable<Try<T>> => {
    return this.applyTransformers(obj)
      .map(value => value.getOrThrow())
      .doOnNext(value => this.applySideEffects(value))
      .map(value => Try.success(value))
      .catchJustReturn(e => Try.failure(e));
  }
}

export class Builder<T extends Filterable> implements BuilderType<Self<T>> {
  private manager: Self<T>;

  constructor() {
    this.manager = new Self();
  }

  public withTransforms = (transforms: TransformMiddleware<T>[]): this => {
    this.manager.transforms = transforms;
    return this;
  }

  public addTransforms = (transforms: TransformMiddleware<T>[]): this => {
    return this.withTransforms(this.manager.transforms.concat(transforms));
  }

  public addTransform = (transform: Transformer<T>, identifier: string): this => {
    this.manager.transforms.push(new Middleware(identifier, transform));
    return this;
  }

  public addGlobalTransform = (transform: Transformer<T>): this => {
    return this.addTransform(transform, Self.globalMWIdentifier);
  }

  public withSideEffects = (sideEffects: SideEffectMiddleware<T>[]): this => {
    this.manager.sideEffects = sideEffects;
    return this;
  }

  public addSideEffects = (sideEffects: SideEffectMiddleware<T>[]): this => {
    return this.withSideEffects(this.manager.sideEffects.concat(sideEffects));
  }

  public addSideEffect = (sideEffect: SideEffect<T>, identifier: string): this => {
    this.manager.sideEffects.push(new Middleware(identifier, sideEffect));
    return this;
  }

  public addGlobalSideEffect = (sideEffect: SideEffect<T>): this => {
    return this.addSideEffect(sideEffect, Self.globalMWIdentifier);
  }

  public withBuildable = (buildable?: Self<T>): this => {
    if (buildable != undefined) {
      return this
        .withTransforms(buildable.transforms)
        .withSideEffects(buildable.sideEffects);
    } else {
      return this;
    }
  }

  public build = (): Self<T> => {
    return this.manager;
  }
}