
/* IMPORT */

import {isArray, isFunction, isObject, isRegExp, isString, isUndefined} from './utils';
import type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Options, State} from './types';

/* MAIN */

const parse = <T, U> ( input: string, rule: Rule<T, U>, context: U, options: Options = {} ): T[] => {

  const state: State<T, U> = { cache: {}, context, input, index: 0, indexMax: 0, options, output: [] };
  const matched = resolve ( rule )( state );

  if ( matched && state.index === input.length ) {

    return state.output;

  } else {

    throw new Error ( `Failed to parse at index ${state.indexMax}` );

  }

};

const validate = <T, U> ( input: string, rule: Rule<T, U>, context: U ): boolean => {

  try {

    parse ( input, rule, context );

    return true;

  } catch {

    return false;

  }

};

/* RULES - PRIMIVITE */

const match = <T, U> ( target: RegExp | string, handler?: PrimitiveHandler<T> | T ): ExplicitRule<T, U> => {

  if ( isString ( target ) ) { // Matching a string, slightly faster

    return ( state: State<T, U> ): boolean => {

      const index = state.index;
      const input = state.input;

      for ( let i = 0, l = target.length; i < l; i++ ) {

        if ( input[index + i] !== target[i] ) return false;

      }

      if ( !isUndefined ( handler ) ) {

        const output = isFunction ( handler ) ? handler ( target, input, String ( index ) ) : handler;

        state.output.push ( output );

      }

      state.index += target.length;
      state.indexMax = Math.max ( state.indexMax, state.index );

      return true;

    };

  } else { // Matching a regex, slightly slower

    const source = target.source;
    const flags = target.flags.replace ( /y|$/, 'y' );
    const re = new RegExp ( source, flags );

    return ( state: State<T, U> ): boolean => {

      const index = state.index;
      const input = state.input;

      re.lastIndex = index;

      const match = re.exec ( input );

      if ( !match ) return false;

      if ( !isUndefined ( handler ) ) {

        const output = isFunction ( handler ) ? handler ( ...match, input, String ( index ) ) : handler;

        state.output.push ( output );

      }

      state.index += match[0].length;
      state.indexMax = Math.max ( state.indexMax, state.index );

      return true;

    };

  }

};

/* RULES - REPETITION */

const repeat = <T, U> ( rule: Rule<T, U>, min: number, max: number, handler?: CompoundHandler<T> ): ExplicitRule<T, U> => {

  const erule = resolve ( rule );

  return memoizable ( handleable ( backtrackable ( ( state: State<T, U> ): boolean => {

    let repetitions = 0;

    while ( repetitions < max ) {

      const matched = erule ( state );

      if ( !matched ) break;

      repetitions += 1;

      if (  state.index === state.input.length ) break;

    }

    return ( repetitions >= min );

  }), handler ));

};

const optional = <T, U> ( rule: Rule<T, U>, handler?: CompoundHandler<T> ): ExplicitRule<T, U> => {

  return repeat ( rule, 0, 1, handler );

};

const star = <T, U> ( rule: Rule<T, U>, handler?: CompoundHandler<T> ): ExplicitRule<T, U> => {

  return repeat ( rule, 0, Infinity, handler );

};

const plus = <T, U> ( rule: Rule<T, U>, handler?: CompoundHandler<T> ): ExplicitRule<T, U> => {

  return repeat ( rule, 1, Infinity, handler );

};

/* RULES - SEQUENCE */

const and = <T, U> ( rules: Rule<T, U>[], handler?: CompoundHandler<T> ): ExplicitRule<T, U> => {

  const erules = rules.map ( resolve );

  return memoizable ( handleable ( backtrackable ( ( state: State<T, U> ): boolean => {

    for ( let i = 0, l = erules.length; i < l; i++ ) {

      const matched = erules[i]( state );

      if ( !matched ) return false;

    }

    return true;

  }), handler ));

};

const or = <T, U> ( rules: Rule<T, U>[], handler?: CompoundHandler<T> ): ExplicitRule<T, U> => {

  const erules = rules.map ( resolve );

  return memoizable ( handleable ( backtrackable ( ( state: State<T, U> ): boolean => {

    for ( let i = 0, l = erules.length; i < l; i++ ) {

      const matched = erules[i]( state );

      if ( matched ) return true;

    }

    return false;

  }), handler ));

};

/* RULES - LOOKAHEAD */

const lookahead = <T, U> ( rule: Rule<T, U>, result: boolean ): ExplicitRule<T, U> => {

  const erule = resolve ( rule );

  return backtrackable ( ( state: State<T, U> ): boolean => {

    return erule ( state ) === result;

  }, true );

};

const not = <T, U> ( rule: Rule<T, U> ): ExplicitRule<T, U> => {

  return lookahead ( rule, false );

};

const equals = <T, U> ( rule: Rule<T, U> ): ExplicitRule<T, U> => {

  return lookahead ( rule, true );

};

/* RULES - DECORATORS */

const backtrackable = <T, U> ( rule: Rule<T, U>, force: boolean = false ): ExplicitRule<T, U> => {

  const erule = resolve ( rule );

  return ( state: State<T, U> ): boolean => {

    const index = state.index;
    const length = state.output.length;
    const matched = erule ( state );

    if ( !matched || force ) {

      state.index = index;

      if ( state.output.length !== length ) { // This can be surprisingly slow

        state.output.length = length;

      }

    }

    return matched;

  };

};

const handleable = <T, U> ( rule: Rule<T, U>, handler?: CompoundHandler<T> ): ExplicitRule<T, U> => {

  const erule = resolve ( rule );

  return ( state: State<T, U> ): boolean => {

    const length = state.output.length;
    const matched = erule ( state );

    if ( matched && handler ) {

      const tokens = state.output.splice ( length, Infinity );
      const output = handler ( tokens );

      state.output.push ( output );

    }

    return matched;

  };

};

const memoizable = <T, U> ( rule: Rule<T, U> ): ExplicitRule<T, U> => {

  // return rule;

  const erule = resolve ( rule );
  const symbol = Symbol ();

  return ( state: State<T, U> ): boolean => {

    if ( state.options.memoization === false ) return erule ( state );

    const key = state.index;
    const cache = ( state.cache[symbol] ||= {} );
    const cached = cache[key];

    if ( cached === false ) {

      return false;

    } else if ( cached ) {

      state.index = cached.index;
      state.output.push ( ...cached.output );

      return true;

    } else {

      const length = state.output.length;
      const matched = erule ( state );

      if ( matched ) {

        const index = state.index;
        const output = state.output.slice ( length, Infinity );

        cache[key] = { index, output };

        return true;

      } else {

        cache[key] = false;

        return false;

      }

    }

  };

};

/* RULES - OTHERS */

const lazy = <T = any, U = any> ( getter: Function ): ExplicitRule<T, U> => { //TSC: It can't be typed properly due to circular references

  let erule: ExplicitRule<T, U>;

  return ( state: State<T, U> ): boolean => {

    erule ||= resolve ( getter () );

    return erule ( state );

  };

};

const resolve = <T, U> ( rule: Rule<T, U> ): ExplicitRule<T, U> => {

  if ( isFunction ( rule ) ) {

    return rule;

  }

  if ( isString ( rule ) || isRegExp ( rule ) ) {

    return match<T, U> ( rule );

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
export {not, equals};
export {lazy};
export type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Options, State};
