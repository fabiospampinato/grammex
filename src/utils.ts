
/* IMPORT */

import type {EagerRule, LazyRule} from './types';

/* MAIN */

const escapeRegExp = ( value: string ): string => {

  return value.replace ( /([$.*+?^(){}[\]\|])/g, char => `\\${char}` );

};

const isArray = ( value: unknown ): value is unknown[] => {

  return Array.isArray ( value );

};

const isFunction = ( value: unknown ): value is Function => {

  return typeof value === 'function';

};

const isLazy = <T, U> ( rule: EagerRule<T, U> | LazyRule<T, U> ): rule is LazyRule<T, U> => {

  return !rule.length;

};

const isObject = ( value: unknown ): value is object => {

  return ( typeof value === 'object' && value !== null );

};

const isRegExp = ( value: unknown ): value is RegExp => {

  return value instanceof RegExp;

};

const isString = ( value: unknown ): value is string => {

  return typeof value === 'string';

};

const isUndefined = ( value: unknown ): value is undefined => {

  return value === undefined;

};

const memoize = <T, U> ( fn: ( arg: T ) => U ): (( arg: T ) => U) => {

  const cache = new Map<T, U> ();

  return ( arg: T ): U => {

    const cached = cache.get ( arg );

    if ( cached ) return cached;

    const value = fn ( arg );

    cache.set ( arg, value );

    return value;

  };

};

/* EXPORT */

export {escapeRegExp, isArray, isFunction, isLazy, isObject, isRegExp, isString, isUndefined, memoize};
