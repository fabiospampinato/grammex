
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

const isNumber = ( value: unknown ): value is number => {

  return typeof value === 'number';

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

export {isArray, isFunction, isFunctionNullary, isNumber, isObject, isRegExp, isString, isUndefined};
