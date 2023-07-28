
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
const String = /\s*"(?:\\.|\\u[0-9A-Fa-f]{4}|[^"])*"\s*/;

const Array = ['[', _, optional ([ LAZY_JSON, star ([ ',', LAZY_JSON ]) ]), _, ']'];
const Object = ['{', _, optional ([ String, ':', LAZY_JSON, star ([ ',', String, ':', LAZY_JSON ]) ]), _, '}'];

const JSON = [optional ( _ ), { Object, Array, String, True, False, Null, Number }, optional ( _ )];

/* EXPORT */

export default JSON;
