
/* IMPORT */

import {match, and, jump, lazy, optional, star} from '../dist/index.js';

/* HELPERS */

const toArray = values => {
  return values;
};

const toObject = values => {
  const object = {};
  for ( let i = 0, l = values.length; i < l; i += 2 ) {
    const key = values[i];
    const value = values[i + 1];
    object[key] = value;
  }
  return object;
};

const toString = value => {
  const unquoted = value.slice ( 1, -1 );
  if ( unquoted.includes ( '\\' ) ) {
    return unescape ( unquoted );
  } else {
    return unquoted;
  }
};

const unescape = value => {
  return value.replaceAll ( /\\["\\\/bfnrt]|\\u[0-9A-Fa-f]{4}/g, match => {
    switch ( match[1] ) {
      case 'b': return '\b';
      case 'f': return '\f';
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
      case '"': return '"';
      case '\\': return '\\';
      case 'u': return String.fromCharCode ( parseInt ( match.slice ( 2 ), 16 ) );
      default: return match.slice ( 1 );
    }
  });
};

/* MAIN */

const LAZY_JSON = lazy ( () => JSON );

// const _ = /\s*/;
// const _ = /[ \n\r\t]*/;
const _ = match ([ ' ', '\n', '\r', '\t' ]);

const Null = match ( /null/, null );
const False = match ( /false/, false );
const True = match ( /true/, true );
const Number = match ( /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?/, parseFloat );
const String = match ( /"(?:\\.|\\u[0-9A-Fa-f]{4}|[^"\r\n])*"/, toString );

const Array = and ( ['[', _, optional ([ LAZY_JSON, star ([ ',', LAZY_JSON ]) ]), _, ']'], toArray );
const Object = and ( ['{', _, optional ([ String, _, ':', LAZY_JSON, star ([ ',', _, String, _, ':', LAZY_JSON ]) ]), _, '}'], toObject );

// const Value = { Null, False, True, Number, String, Array, Object };
const Value = jump ({ 'n': Null, 'f': False, 't': True, '"': String, '[': Array, '{': Object, 'default': Number });

const JSON = [_, Value, _];

/* EXPORT */

export default JSON;
