
/* IMPORT */

import {match, jump, optional, star, lazy} from '../dist/index.js';

/* MAIN */

const LAZY_JSON = lazy ( () => JSON );

// const _ = /\s*/;
const _ = match ([ '\r', '\n', '\t', '\f', '\v', ' ' ]);

const Null = 'null';
const False = 'false';
const True = 'true';
const Number = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?/;
const String = /"(?:\\u[0-9A-Fa-f]{4}|\\.|[^"\\]+|[^"])*"/;

const Array = ['[', _, optional ([ LAZY_JSON, star ([ ',', LAZY_JSON ]) ]), _, ']'];
const Object = ['{', _, optional ([ String, _, ':', LAZY_JSON, star ([ ',', _, String, _, ':', LAZY_JSON ]) ]), _, '}'];

// const Value = { Null, False, True, Number, String, Array, Object };
const Value = jump ({ 'n': Null, 'f': False, 't': True, '"': String, '[': Array, '{': Object, 'default': Number });

const JSON = [_, Value, _];

/* EXPORT */

export default JSON;
