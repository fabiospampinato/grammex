
/* IMPORT */

import {escapeRegExp, isArray, isFunction, isLazy, isPlainObject, isRegExp, isString, isUndefined, memoize} from './utils';
import type {MatchHandler, EagerRule, LazyRule, ImplicitRule, Rule, State} from './types';

/* MAIN */

//TODO: Provide some decent error messages

const exec = <T, U> ( rule: Rule<T, U>, state: State<T, U> ): boolean => {

  return resolve ( rule )( state );

};

const parse = <T, U> ( input: string, rule: Rule<T, U>, options: U ): T[] => {

  const state: State<T, U> = { options, input, index: 0, output: [] };
  const matched = exec ( rule, state );

  if ( matched && state.index === input.length ) {

    return state.output;

  } else {

    throw new Error ( 'Failed to parse' );

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

const match = <T, U> ( regex: RegExp, handler?: MatchHandler<T> | T ): EagerRule<T, U> => {

  const source = regex.source;
  const flags = regex.flags.replace ( /y|$/, 'y' );
  const re = new RegExp ( source, flags );

  return backtrack ( ( state: State<T, U> ): boolean => {

    const index = state.index;

    re.lastIndex = index;

    const match = re.exec ( state.input );

    if ( !match ) return false;

    const [consumed, ...groups] = match;

    if ( !isUndefined ( handler ) ) {

      const output = isFunction ( handler ) ? handler ( consumed, ...groups, state.input, String ( index ) ) : handler;

      state.output.push ( output );

    }

    state.index += consumed.length;

    return true;

  });

};

/* RULES - REPETITION */

const repeat = <T, U> ( rule: Rule<T, U>, min: number, max: number ): EagerRule<T, U> => {

  return backtrack ( ( state: State<T, U> ): boolean => {

    let repetitions = 0;

    while ( repetitions < max ) {

      const matched = exec ( rule, state );

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

  return backtrack ( ( state: State<T, U> ): boolean => {

    for ( let i = 0, l = rules.length; i < l; i++ ) {

      const matched = exec ( rules[i], state );

      if ( !matched ) return false;

    }

    return true;

  });

};

const or = <T, U> ( rules: Rule<T, U>[] ): EagerRule<T, U> => {

  return backtrack ( ( state: State<T, U> ): boolean => {

    for ( let i = 0, l = rules.length; i < l; i++ ) {

      const matched = exec ( rules[i], state );

      if ( matched ) return true;

    }

    return false;

  });

};

/* RULES - LOOKAHEAD */

const lookahead = <T, U> ( rule: Rule<T, U>, result: boolean ): EagerRule<T, U> => {

  return backtrack ( ( state: State<T, U> ): boolean => {

    return exec ( rule, state ) === result;

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

  return ( state: State<T, U> ): boolean => {

    const index = state.index;
    const length = state.output.length;
    const matched = exec ( rule, state );

    if ( !matched || force ) {

      state.index = index;
      state.output.length = length;

    }

    return matched;

  };

};

const lazy = ( getter: Function ): any => { //TSC: But it can't be typed properly due to circular references

  return () => getter;

};

const resolve = memoize (<T, U> ( rule: Rule<T, U> ): EagerRule<T, U> => {

  if ( isFunction ( rule ) ) {

    if ( isLazy ( rule ) ) {

      return rule ();

    } else {

      return rule;

    }

  }

  if ( isString ( rule ) ) {

    return match<T, U> ( new RegExp ( escapeRegExp ( rule ) ) );

  }

  if ( isRegExp ( rule ) ) {

    return match<T, U> ( rule );

  }

  if ( isArray ( rule ) ) {

    return and ( rule.map ( resolve ) );

  }

  if ( isPlainObject ( rule ) ) {

    return or ( Object.values ( rule ).map ( resolve ) );

  }

  throw new Error ( 'Invalid rule' );

});

/* EXPORT */

export {exec, parse, validate};
export {match};
export {repeat, optional, star, plus};
export {and, or};
export {not, equals};
export {backtrack, lazy};
export type {MatchHandler, EagerRule, LazyRule, ImplicitRule, Rule, State};
