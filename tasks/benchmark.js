
/* IMPORT */

import benchmark from 'benchloop';
import fs from 'node:fs';
import {parse, validate} from '../dist/index.js';
import JSON_GRAMMAR from './grammar.js';

/* HELPERS */

const JSON_SAMPLE = fs.readFileSync ( 'tasks/sample.json', 'utf8' );

/* MAIN */

benchmark.config ({
  iterations: 1000
});

benchmark ({
  name: 'grammex.parse.memoized',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMAR );
  }
});

benchmark ({
  name: 'grammex.parse.unmemoized',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMAR, { memoization: false } );
  }
});

benchmark ({
  name: 'grammex.validate.memoized',
  fn: () => {
    validate ( JSON_SAMPLE, JSON_GRAMMAR );
  }
});

benchmark ({
  name: 'grammex.validate.unmemoized',
  fn: () => {
    validate ( JSON_SAMPLE, JSON_GRAMMAR, { memoization: false } );
  }
});

benchmark ({
  name: 'json.parse',
  fn: () => {
    JSON.parse ( JSON_SAMPLE );
  }
});

benchmark.summary ();
