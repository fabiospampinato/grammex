
/* IMPORT */

import {isArray, isFunction, isFunctionNullary, isNumber, isObject, isRegExp, isString, isUndefined} from './utils';
import type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Options, State} from './types';

/* MAIN */

const parse = <T> ( input: string, rule: Rule<T>, options: Options = {} ): T[] => {

  const state: State<T> = { cache: {}, input, index: 0, indexMax: 0, options, output: [] };
  const matched = resolve ( rule )( state );

  if ( matched && state.index === input.length ) {

    return state.output;

  } else {

    throw new Error ( `Failed to parse at index ${state.indexMax}` );

  }

};

const validate = <T> ( input: string, rule: Rule<T>, options: Options = {} ): boolean => {

  try {

    parse ( input, rule, { ...options, silent: true } );

    return true;

  } catch {

    return false;

  }

};

/* RULES - PRIMIVITE */

const match = <T> ( target: RegExp | string, handler?: PrimitiveHandler<T> | T ): ExplicitRule<T> => {

  return isString ( target ) ? string ( target, handler ) : regex ( target, handler );

};

const regex = <T> ( target: RegExp, handler?: PrimitiveHandler<T> | T ): ExplicitRule<T> => {

  const source = target.source;
  const flags = target.flags.replace ( /y|$/, 'y' );
  const re = new RegExp ( source, flags );

  return memoizable (( state: State<T> ): boolean => {

    re.lastIndex = state.index;

    const match = re.exec ( state.input );

    if ( match ) {

      if ( !isUndefined ( handler ) && !state.options.silent ) {

        const output = isFunction ( handler ) ? handler ( ...match, state.input, String ( state.index ) ) : handler;

        state.output.push ( output );

      }

      state.index += match[0].length;
      state.indexMax = Math.max ( state.indexMax, state.index );

      return true;

    } else {

      return false;

    }

  });

};

const string = <T> ( target: string, handler?: PrimitiveHandler<T> | T ): ExplicitRule<T> => {

  return ( state: State<T> ): boolean => { // Not memoized on purpose, as the memoization is likely to cost more than the re-execution

    if ( state.input.startsWith ( target, state.index ) ) {

      if ( !isUndefined ( handler ) && !state.options.silent ) {

        const output = isFunction ( handler ) ? handler ( target, state.input, String ( state.index ) ) : handler;

        state.output.push ( output );

      }

      state.index += target.length;
      state.indexMax = Math.max ( state.indexMax, state.index );

      return true;

    } else {

      return false;

    }

  };

};

/* RULES - REPETITION */

const repeat = <T> ( rule: Rule<T>, min: number, max: number, handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  const erule = resolve ( rule );

  return memoizable ( handleable ( backtrackable ( ( state: State<T> ): boolean => {

    let repetitions = 0;

    while ( repetitions < max ) {

      const matched = erule ( state );

      if ( !matched ) break;

      repetitions += 1;

      if ( state.index === state.input.length ) break; //TODO: Is this really working? comment it out

    }

    return ( repetitions >= min );

  }), handler ));

};

const optional = <T> ( rule: Rule<T>, handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  return repeat ( rule, 0, 1, handler );

};

const star = <T> ( rule: Rule<T>, handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  return repeat ( rule, 0, Infinity, handler );

};

const plus = <T> ( rule: Rule<T>, handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  return repeat ( rule, 1, Infinity, handler );

};

/* RULES - SEQUENCE */

const and = <T> ( rules: Rule<T>[], handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  const erules = rules.map ( resolve );

  return memoizable ( handleable ( backtrackable ( ( state: State<T> ): boolean => {

    return erules.every ( erule => erule ( state ) );

  }), handler ));

};

const or = <T> ( rules: Rule<T>[], handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  const erules = rules.map ( resolve );

  return memoizable ( handleable ( backtrackable ( ( state: State<T> ): boolean => {

    return erules.some ( erule => erule ( state ) );

  }), handler ));

};

/* RULES - LOOKAHEAD */

const lookahead = <T> ( rule: Rule<T>, result: boolean ): ExplicitRule<T> => {

  const erule = resolve ( rule );

  return backtrackable ( ( state: State<T> ): boolean => {

    return erule ( state ) === result;

  }, true );

};

const negative = <T> ( rule: Rule<T> ): ExplicitRule<T> => {

  return lookahead ( rule, false );

};

const positive = <T> ( rule: Rule<T> ): ExplicitRule<T> => {

  return lookahead ( rule, true );

};

/* RULES - DECORATORS */

const backtrackable = <T> ( rule: Rule<T>, force: boolean = false ): ExplicitRule<T> => {

  const erule = resolve ( rule );

  return ( state: State<T> ): boolean => {

    const index = state.index;
    const length = state.output.length;
    const matched = erule ( state );

    if ( !matched || force ) {

      state.index = index;

      if ( state.output.length !== length ) { // This can be surprisingly slow otherwise

        state.output.length = length;

      }

    }

    return matched;

  };

};

const handleable = <T> ( rule: Rule<T>, handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  const erule = resolve ( rule );

  if ( !handler ) return erule;

  return ( state: State<T> ): boolean => {

    if ( state.options.silent ) return erule ( state );

    const length = state.output.length;
    const matched = erule ( state );

    if ( matched ) {

      const outputs = state.output.splice ( length, Infinity );
      const output = handler ( outputs );

      state.output.push ( output );

      return true;

    } else {

      return false;

    }

  };

};

const memoizable = <T> ( rule: Rule<T> ): ExplicitRule<T> => {

  const erule = resolve ( rule );
  const symbol = Symbol ();

  return ( state: State<T> ): boolean => {

    if ( state.options.memoization === false ) return erule ( state );

    const indexStart = state.index;
    const cache = ( state.cache[symbol] ||= new Map () );
    const cached = cache.get ( indexStart );

    if ( cached === false ) {

      return false;

    } else if ( isNumber ( cached ) ) {

      state.index = cached;

      return true;

    } else if ( cached ) {

      state.index = cached.index;

      if ( cached.output?.length ) {

        state.output.push ( ...cached.output );

      }

      return true;

    } else {

      const lengthStart = state.output.length;
      const matched = erule ( state );

      if ( matched ) {

        const indexEnd = state.index;
        const lengthEnd = state.output.length;

        if ( lengthEnd > lengthStart ) {

          const output = state.output.slice ( lengthStart, lengthEnd );

           cache.set ( indexStart, { index: indexEnd, output } );

        } else {

          cache.set ( indexStart, indexEnd );

        }

        return true;

      } else {

        cache.set ( indexStart, false );

        return false;

      }

    }

  };

};

/* RULES - OTHERS */

const lazy = <T = any> ( getter: Function ): ExplicitRule<T> => { //TSC: It can't be typed properly due to circular references

  let erule: ExplicitRule<T>;

  return ( state: State<T> ): boolean => {

    erule ||= resolve ( getter () );

    return erule ( state );

  };

};

const resolve = <T> ( rule: Rule<T> ): ExplicitRule<T> => {

  if ( isFunction ( rule ) ) {

    if ( isFunctionNullary ( rule ) ) {

      return lazy ( rule );

    }

    return rule;

  }

  if ( isString ( rule ) || isRegExp ( rule ) ) {

    return match<T> ( rule );

  }

  if ( isArray ( rule ) ) {

    return and ( rule );

  }

  if ( isObject ( rule ) ) {

    return or ( Object.values ( rule ) );

  }

  throw new Error ( 'Invalid rule' );

};

/* EXPORT */

export {parse, validate};
export {match};
export {repeat, optional, star, plus};
export {and, or};
export {negative, positive};
export {lazy};
export type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Options, State};
