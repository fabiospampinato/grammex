
/* IMPORT */

import benchmark from 'benchloop';
import fs from 'node:fs';
import {parse} from '../dist/index.js';
import JSON_GRAMMAR from './json.js';

/* HELPERS */

const JSON_SAMPLE = fs.readFileSync ( 'tasks/sample.json', 'utf8' );

/* MAIN */

benchmark.config ({
  iterations: 1000
});

benchmark ({
  name: 'grammex.parse',
  fn: () => {
    parse ( JSON_SAMPLE, JSON_GRAMMAR, {} );
  }
});

benchmark.summary ();
