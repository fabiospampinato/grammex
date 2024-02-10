
/* IMPORT */

import {isArray, isFunction, isFunctionNullary, isNumber, isObject, isRegExp, isString, isUndefined, memoize} from './utils';
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

    parse ( input, rule, options );

    return true;

  } catch {

    return false;

  }

};

/* RULES - PRIMIVITE */

const match = <T> ( target: RegExp | string | string[], handler?: PrimitiveHandler<T> | T ): ExplicitRule<T> => {

  return isArray ( target ) ? chars ( target, handler ) : isString ( target ) ? string ( target, handler ) : regex ( target, handler );

};

const chars = <T> ( target: string[], handler?: PrimitiveHandler<T> | T ): ExplicitRule<T> => {

  const charCodes: Record<string, boolean> = {};

  for ( const char of target ) {

    if ( char.length !== 1 ) throw new Error ( `Invalid character: "${char}"` );

    const charCode = char.charCodeAt ( 0 );

    charCodes[charCode] = true;

  }

  return ( state: State<T> ): boolean => { // Not memoized on purpose, as the memoization is likely to cost more than the re-execution

    const indexStart = state.index;
    const input = state.input;

    while ( state.index < input.length ) {

      const charCode = input.charCodeAt ( state.index );

      if ( !( charCode in charCodes ) ) break;

      state.index += 1;

    }

    const indexEnd = state.index;

    if ( indexEnd > indexStart ) {

      if ( !isUndefined ( handler ) && !state.options.silent ) {

        const target = state.input.slice ( indexStart, indexEnd );
        const output = isFunction ( handler ) ? handler ( target, input, String ( indexStart ) ) : handler;

        if ( !isUndefined ( output ) ) {

          state.output.push ( output );

        }

      }

      state.indexMax = Math.max ( state.indexMax, state.index );

    }

    return true;

  };

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

        if ( !isUndefined ( output ) ) {

          state.output.push ( output );

        }

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

    const isMatch = state.input.startsWith ( target, state.index );

    if ( isMatch ) {

      if ( !isUndefined ( handler ) && !state.options.silent ) {

        const output = isFunction ( handler ) ? handler ( target, state.input, String ( state.index ) ) : handler;

        if ( !isUndefined ( output ) ) {

          state.output.push ( output );

        }

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

      const index = state.index;
      const matched = erule ( state );

      if ( !matched ) break;

      repetitions += 1;

      if ( state.index === index ) break;

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

    for ( let i = 0, l = erules.length; i < l; i++ ) {

      if ( !erules[i]( state ) ) return false;

    }

    return true;

  }), handler ));

};

/* RULES - CHOICE */

const or = <T> ( rules: Rule<T>[], handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  const erules = rules.map ( resolve );

  return memoizable ( handleable ( ( state: State<T> ): boolean => {

    for ( let i = 0, l = erules.length; i < l; i++ ) {

      if ( erules[i]( state ) ) return true;

    }

    return false;

  }, handler ));

};

const jump = <T> ( rules: Record<string, Rule<T>>, handler?: CompoundHandler<T> ): ExplicitRule<T> => {

  const erules: Record<string, ExplicitRule<T>> = {};

  for ( const char in rules ) {

    if ( char.length !== 1 && char !== 'default' ) throw new Error ( `Invalid jump character: "${char}"` );

    erules[char] = resolve ( rules[char] );

  }

  return handleable ( ( state: State<T> ): boolean => {

    const char = state.input[state.index];
    const erule = erules[char] || erules['default'];

    if ( erule ) {

      return erule ( state );

    } else {

      return false;

    }

  }, handler );

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

      if ( !isUndefined ( output ) ) {

        state.output.push ( output );

      }

      return true;

    } else {

      return false;

    }

  };

};

const memoizable = (() => {

  let RULE_ID = 0; // This is faster than using symbols, for some reason

  return <T> ( rule: Rule<T> ): ExplicitRule<T> => {

    const erule = resolve ( rule );
    const ruleId = ( RULE_ID += 1 );

    return ( state: State<T> ): boolean => {

      if ( state.options.memoization === false ) return erule ( state );

      const indexStart = state.index;
      const cache = ( state.cache[ruleId] ||= new Map () );
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

})();

/* RULES - UTILITIES */

const grammar = <T, U> ( fn: ( operators: { match: typeof match<T>, repeat: typeof repeat<T>, optional: typeof optional<T>, star: typeof star<T>, plus: typeof plus<T>, and: typeof and<T>, or: typeof or<T>, jump: typeof jump<T>, negative: typeof negative<T>, positive: typeof positive<T>, lazy: typeof lazy<T> } ) => U ): U => { // Useful for fixing the "T" type across all operators

  return fn ({
    match: match<T>,
    repeat: repeat<T>,
    optional: optional<T>,
    star: star<T>,
    plus: plus<T>,
    and: and<T>,
    or: or<T>,
    jump: jump<T>,
    negative: negative<T>,
    positive: positive<T>,
    lazy: lazy<T>
  });

};

const lazy = <T = any> ( getter: Function ): ExplicitRule<T> => { //TSC: It can't be typed properly due to circular references

  let erule: ExplicitRule<T>;

  return ( state: State<T> ): boolean => {

    erule ||= resolve ( getter () );

    return erule ( state );

  };

};

const resolve = memoize (<T> ( rule: Rule<T> ): ExplicitRule<T> => {

  if ( isFunction ( rule ) ) {

    if ( isFunctionNullary ( rule ) ) {

      return lazy ( rule );

    } else {

      return rule;

    }

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

});

/* EXPORT */

export {parse, validate};
export {match};
export {repeat, optional, star, plus};
export {and};
export {or, jump};
export {negative, positive};
export {grammar, lazy};
export type {CompoundHandler, PrimitiveHandler, ExplicitRule, ImplicitRule, Rule, Options, State};
