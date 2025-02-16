
/* MAIN */

const isArray = ( value: unknown ): value is unknown[] => {

  return Array.isArray ( value );

};

const isFunction = ( value: unknown ): value is Function => {

  return typeof value === 'function';

};

const isFunctionNullary = ( value: Function ): value is (() => unknown) => {

  return value.length === 0;

};

const isFunctionStrictlyNullary = ( value: Function ): boolean => {

  return value.length === 0 && value.toString ().startsWith ( '() =>' );

};

const isNumber = ( value: unknown ): value is number => {

  return typeof value === 'number';

};

const isObject = ( value: unknown ): value is object => {

  return typeof value === 'object' && value !== null;

};

const isRegExp = ( value: unknown ): value is RegExp => {

  return value instanceof RegExp;

};

const isRegExpCapturing = (() => { //TODO: Implement this perfectly instead, by parsing the regex

  const sourceRe = /\\\(|\((?!\?(?::|=|!|<=|<!))/;

  return ( re: RegExp ): boolean => {

    return sourceRe.test ( re.source );

  };

})();

const isRegExpStatic = (() => { //TODO: Implement this perfectly instead, by parsing the regex

  const sourceRe = /^[a-zA-Z0-9_-]+$/;

  return ( re: RegExp ): boolean => {

    return sourceRe.test ( re.source ) && !re.flags.includes ( 'i' );

  };

})();

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

    if ( cached !== undefined ) return cached;

    const value = fn ( arg );

    cache.set ( arg, value );

    return value;

  };

};

/* EXPORT */

export {isArray, isFunction, isFunctionNullary, isFunctionStrictlyNullary, isNumber, isObject, isRegExp, isRegExpCapturing, isRegExpStatic, isString, isUndefined, memoize};
