
/* MAIN */

const isArray = ( value: unknown ): value is unknown[] => {

  return Array.isArray ( value );

};

const isFunction = ( value: unknown ): value is Function => {

  return typeof value === 'function';

};

const isObject = ( value: unknown ): value is object => {

  return typeof value === 'object' && value !== null;

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

/* EXPORT */

export {isArray, isFunction, isObject, isRegExp, isString, isUndefined};
