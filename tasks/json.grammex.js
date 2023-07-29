
/* IMPORT */

import {optional, star, lazy} from '../dist/index.js';

/* MAIN */

//TODO: Support implicit lazy rules

const LAZY_JSON = lazy ( () => JSON );

const _ = /\s*/;

const Null = 'null'
const False = 'false';
const True = 'true';
const Number = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][-+]?[0-9]+)?/;
const String = /"(?:\\.|\\u[0-9A-Fa-f]{4}|[^"])*"/;

const Array = ['[', _, optional ([ LAZY_JSON, star ([ ',', LAZY_JSON ]) ]), _, ']'];
const Object = ['{', _, optional ([ String, _, ':', LAZY_JSON, star ([ ',', _, String, _, ':', LAZY_JSON ]) ]), _, '}'];

const JSON = [_, { Object, Array, String, True, False, Null, Number }, _];

/* EXPORT */

export default JSON;
