
/* IMPORT */

import {escapeRegExp, isArray, isFunction, isObject, isRegExp, isString, isUndefined} from './utils';
import type {MatchHandler, EagerRule, ImplicitRule, Rule, State} from './types';

/* MAIN */

//TODO: Add support for actual backtracking for repeat/optional/star/plus, both greedy and lazy

const parse = <T, U> ( input: string, rule: Rule<T, U>, options: U ): T[] => {

  const state: State<T, U> = { options, input, index: 0, indexMax: 0, output: [] };
  const matched = resolve ( rule )( state );

  if ( matched && state.index === input.length ) {

    return state.output;

  } else {

    throw new Error ( `Failed to parse at index ${state.indexMax}` );

  }

};

const validate = <T, U> ( input: string, rule: Rule<T, U>, options: U ): boolean => {

  try {

    parse ( input, rule, options );

    return true;

  } catch {

    return false;

  }

};

/* RULES - PRIMIVITE */

const match = <T, U> ( target: RegExp | string, handler?: MatchHandler<T> | T ): EagerRule<T, U> => {

  if ( isString ( target ) ) { // Matching a string, slightly faster

    return backtrack ( ( state: State<T, U> ): boolean => {

      const index = state.index;
      const input = state.input;

      for ( let i = 0, l = target.length; i < l; i++ ) {

        if ( input[index + i] !== target[i] ) return false;

      }

      if ( !isUndefined ( handler ) ) {

        const output = isFunction ( handler ) ? handler ( target, state.input, String ( index ) ) : handler;

        state.output.push ( output );

      }

      state.index += target.length;
      state.indexMax = Math.max ( state.indexMax, state.index );

      return true;

    });

  } else { // Matching a regex, slightly slower

    const source = isString ( target ) ? escapeRegExp ( target ) : target.source;
    const flags = isString ( target ) ? 'y' : target.flags.replace ( /y|$/, 'y' );
    const re = new RegExp ( source, flags );

    return backtrack ( ( state: State<T, U> ): boolean => {

      const index = state.index;

      re.lastIndex = index;

      const match = re.exec ( state.input );

      if ( !match ) return false;

      if ( !isUndefined ( handler ) ) {

        const output = isFunction ( handler ) ? handler ( ...match, state.input, String ( index ) ) : handler;

        state.output.push ( output );

      }

      state.index += match[0].length;
      state.indexMax = Math.max ( state.indexMax, state.index );

      return true;

    });

  }

};

/* RULES - REPETITION */

const repeat = <T, U> ( rule: Rule<T, U>, min: number, max: number ): EagerRule<T, U> => {

  const erule = resolve ( rule );

  return backtrack ( ( state: State<T, U> ): boolean => {

    let repetitions = 0;

    while ( repetitions < max ) {

      const matched = erule ( state );

      if ( !matched ) break;

      repetitions += 1;

      if ( repetitions >= min && state.index === state.input.length ) break;

    }

    return ( repetitions >= min );

  });

};

const optional = <T, U> ( rule: Rule<T, U> ): EagerRule<T, U> => {

  return repeat ( rule, 0, 1 );

};

const star = <T, U> ( rule: Rule<T, U> ): EagerRule<T, U> => {

  return repeat ( rule, 0, Infinity );

};

const plus = <T, U> ( rule: Rule<T, U> ): EagerRule<T, U> => {

  return repeat ( rule, 1, Infinity );

};

/* RULES - SEQUENCE */

const and = <T, U> ( rules: Rule<T, U>[] ): EagerRule<T, U> => {

  const erules = rules.map ( resolve );

  return backtrack ( ( state: State<T, U> ): boolean => {

    for ( let i = 0, l = erules.length; i < l; i++ ) {

      const matched = erules[i]( state );

      if ( !matched ) return false;

    }

    return true;

  });

};

const or = <T, U> ( rules: Rule<T, U>[] ): EagerRule<T, U> => {

  const erules = rules.map ( resolve );

  return backtrack ( ( state: State<T, U> ): boolean => {

    for ( let i = 0, l = erules.length; i < l; i++ ) {

      const matched = erules[i]( state );

      if ( matched ) return true;

    }

    return false;

  });

};

/* RULES - LOOKAHEAD */

const lookahead = <T, U> ( rule: Rule<T, U>, result: boolean ): EagerRule<T, U> => {

  const erule = resolve ( rule );

  return backtrack ( ( state: State<T, U> ): boolean => {

    return erule ( state ) === result;

  }, true );

};

const not = <T, U> ( rule: Rule<T, U> ): EagerRule<T, U> => {

  return lookahead ( rule, false );

};

const equals = <T, U> ( rule: Rule<T, U> ): EagerRule<T, U> => {

  return lookahead ( rule, true );

};

/* RULES - OTHERS */

const backtrack = <T, U> ( rule: Rule<T, U>, force: boolean = false ): EagerRule<T, U> => {

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

const lazy = <T = any, U = any> ( getter: Function ): EagerRule<T, U> => { //TSC: It can't be typed properly due to circular references

  let erule: EagerRule<T, U>;

  return ( state: State<T, U> ): boolean => {

    erule ||= getter ();

    return erule ( state );

  };

};

const resolve = <T, U> ( rule: Rule<T, U> ): EagerRule<T, U> => {

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
export {backtrack, lazy};
export type {MatchHandler, EagerRule, ImplicitRule, Rule, State};
