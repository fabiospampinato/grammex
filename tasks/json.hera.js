export default (function(create, rules) {
  return create(create, rules);
}(function(create, rules) {
  var RE_FLAGS, decompile, fail, failExpected, failHintRegex, failIndex, fns, generate, getValue, hToS, invoke, loc, mapValue, maxFailPos, noteName, parse, preComputedRules, precompileHandler, precompute, precomputeRule, prettyPrint, toS, tokenHandler, validate, _names;
  failExpected = Array(16);
  failIndex = 0;
  failHintRegex = /\S+|[^\S]+|$/y;
  maxFailPos = 0;
  fail = function(pos, expected) {
    if (pos < maxFailPos) {
      return;
    }
    if (pos > maxFailPos) {
      maxFailPos = pos;
      failIndex = 0;
    }
    failExpected[failIndex++] = expected;
  };
  RE_FLAGS = "uy";
  prettyPrint = function(v) {
    var name, pv, s;
    pv = v instanceof RegExp ? (s = v.toString(), s.slice(0, s.lastIndexOf('/') + 1)) : typeof v === "string" ? v === "" ? "EOF" : JSON.stringify(v) : v;
    if (name = _names.get(v)) {
      return "" + name + " " + pv;
    } else {
      return pv;
    }
  };
  _names = new Map;
  noteName = function(name, value) {
    if (name) {
      _names.set(value, name);
    }
    return value;
  };
  preComputedRules = null;
  precomputeRule = function(rule, out, name, compile) {
    var arg, data, handler, op, placeholder, result;
    if (Array.isArray(rule)) {
      op = rule[0], arg = rule[1], handler = rule[2];
      result = [
        fns[op], (function() {
          switch (op) {
            case "/":
            case "S":
              return arg.map(function(x) {
                return precomputeRule(x, null, name, compile);
              });
            case "*":
            case "+":
            case "?":
            case "!":
            case "&":
              return precomputeRule(arg, null, name + op, compile);
            case "R":
              return noteName(name, RegExp(arg, RE_FLAGS));
            case "L":
              return noteName(name, JSON.parse("\"" + arg + "\""));
            default:
              throw new Error("Don't know how to pre-compute " + (JSON.stringify(op)));
          }
        })(), compile(handler, op, name)
      ];
      if (out) {
        out[0] = result[0];
        out[1] = result[1];
        out[2] = result[2];
        return out;
      }
      return result;
    } else {
      if (preComputedRules[rule]) {
        return preComputedRules[rule];
      } else {
        preComputedRules[rule] = placeholder = out || [];
        data = rules[rule];
        if (data == null) {
          throw new Error("No rule with name " + (JSON.stringify(rule)));
        }
        return precomputeRule(data, placeholder, rule, compile);
      }
    }
  };
  getValue = function(x) {
    return x.value;
  };
  precompileHandler = function(handler, op) {
    var fn;
    if (handler != null ? handler.f : void 0) {
      fn = Function("$loc", "$0", "$1", "$2", "$3", "$4", "$5", "$6", "$7", "$8", "$9", handler.f);
      if (op === "S") {
        return function(s) {
          return fn.apply(null, [s.loc, s.value].concat(s.value));
        };
      } else if (op === "R") {
        return function(s) {
          return fn.apply(null, [s.loc].concat(s.value));
        };
      } else {
        return function(s) {
          return fn(s.loc, s.value, s.value);
        };
      }
    } else {
      if (op === "R") {
        if (handler != null) {
          return function(s) {
            return mapValue(handler, s.value);
          };
        } else {
          return function(s) {
            return s.value[0];
          };
        }
      } else if (op === "S") {
        if (handler != null) {
          return function(s) {
            return mapValue(handler, [s.value].concat(s.value));
          };
        } else {
          return function(s) {
            return s.value;
          };
        }
      } else {
        return function(s) {
          return mapValue(handler, s.value);
        };
      }
    }
  };
  precompute = function(rules, compile) {
    var first;
    preComputedRules = {};
    first = Object.keys(rules)[0];
    preComputedRules[first] = precomputeRule(first, null, first, compile);
    return preComputedRules;
  };
  invoke = function(state, data) {
    var arg, fn, mapping, result;
    fn = data[0], arg = data[1], mapping = data[2];
    result = fn(state, arg);
    if (mapping == null) {
      mapping = getValue;
    }
    if (result) {
      result.value = mapping(result);
    }
    return result;
  };
  mapValue = function(mapping, value) {
    switch (typeof mapping) {
      case "number":
        return value[mapping];
      case "string":
        return mapping;
      case "object":
        if (Array.isArray(mapping)) {
          return mapping.map(function(n) {
            return mapValue(n, value);
          });
        } else {
          throw new Error("non-array object mapping");
        }
        break;
      case "undefined":
        return value;
      default:
        throw new Error("Unknown mapping type");
    }
  };
  fns = {
    L: function(state, str) {
      var input, length, pos;
      input = state.input, pos = state.pos;
      length = str.length;
      if (input.substr(pos, length) === str) {
        return {
          loc: {
            pos: pos,
            length: length
          },
          pos: pos + length,
          value: str
        };
      } else {
        return fail(pos, str);
      }
    },
    R: function(state, regExp) {
      var input, l, m, pos, v;
      input = state.input, pos = state.pos;
      regExp.lastIndex = state.pos;
      if (m = input.match(regExp)) {
        v = m[0];
      }
      if (v != null) {
        l = v.length;
        return {
          loc: {
            pos: pos,
            length: l
          },
          pos: pos + l,
          value: m
        };
      } else {
        return fail(pos, regExp);
      }
    },
    S: function(state, terms) {
      var i, input, l, pos, r, results, s, value;
      input = state.input, pos = state.pos;
      results = [];
      s = pos;
      i = 0;
      l = terms.length;
      while (true) {
        r = invoke({
          input: input,
          pos: pos
        }, terms[i++]);
        if (r) {
          pos = r.pos, value = r.value;
          results.push(value);
        } else {
          return;
        }
        if (i >= l) {
          break;
        }
      }
      return {
        loc: {
          pos: s,
          length: pos - s
        },
        pos: pos,
        value: results
      };
    },
    "/": function(state, terms) {
      var i, l, r;
      i = 0;
      l = terms.length;
      while (true) {
        r = invoke(state, terms[i++]);
        if (r) {
          return r;
        }
        if (i >= l) {
          break;
        }
      }
    },
    "?": function(state, term) {
      return invoke(state, term) || state;
    },
    "*": function(state, term) {
      var input, pos, prevPos, r, results, s, value;
      input = state.input, pos = state.pos;
      s = pos;
      results = [];
      while (true) {
        prevPos = pos;
        r = invoke({
          input: input,
          pos: pos
        }, term);
        if (r == null) {
          break;
        }
        pos = r.pos, value = r.value;
        if (pos === prevPos) {
          break;
        } else {
          results.push(value);
        }
      }
      return {
        loc: {
          pos: s,
          length: pos - s
        },
        pos: pos,
        value: results
      };
    },
    "+": function(state, term) {
      var first, input, pos, rest, s;
      input = state.input, s = state.pos;
      first = invoke(state, term);
      if (first == null) {
        return;
      }
      pos = first.pos;
      pos = (rest = invoke({
        input: input,
        pos: pos
      }, [fns["*"], term])).pos;
      rest.value.unshift(first.value);
      return {
        loc: {
          pos: s,
          length: pos - s
        },
        value: rest.value,
        pos: pos
      };
    },
    "!": function(state, term) {
      var newState;
      newState = invoke(state, term);
      if (newState != null) {

      } else {
        return state;
      }
    },
    "&": function(state, term) {
      var newState;
      newState = invoke(state, term);
      if (newState.pos === state.pos) {

      } else {
        return state;
      }
    }
  };
  loc = function(input, pos) {
    var column, line, rawPos, _ref;
    rawPos = pos;
    _ref = input.split(/\n|\r\n|\r/).reduce(function(_arg, line) {
      var col, l, row;
      row = _arg[0], col = _arg[1];
      l = line.length + 1;
      if (pos > l) {
        pos -= l;
        return [row + 1, 1];
      } else if (pos >= 0) {
        col += pos;
        pos = -1;
        return [row, col];
      } else {
        return [row, col];
      }
    }, [1, 1]), line = _ref[0], column = _ref[1];
    return "" + line + ":" + column;
  };
  validate = function(input, result, _arg) {
    var expectations, filename, hint, l;
    filename = _arg.filename;
    if ((result != null) && result.pos === input.length) {
      return result.value;
    }
    expectations = Array.from(new Set(failExpected.slice(0, failIndex)));
    l = loc(input, maxFailPos);
    if ((result != null) && result.pos > maxFailPos) {
      l = loc(input, result.pos);
      throw new Error("Unconsumed input at " + l + "\n\n" + (input.slice(result.pos)) + "\n");
    } else if (expectations.length) {
      failHintRegex.lastIndex = maxFailPos;
      hint = input.match(failHintRegex)[0];
      if (hint.length) {
        hint = prettyPrint(hint);
      } else {
        hint = "EOF";
      }
      throw new Error("" + filename + ":" + l + " Failed to parse\nExpected:\n\t" + (expectations.map(prettyPrint).join("\n\t")) + "\nFound: " + hint);
    } else {
      throw new Error("Unconsumed input at " + l + "\n\n" + (input.slice(result.pos)) + "\n");
    }
  };
  parse = function(input, opts) {
    var result, state;
    if (opts == null) {
      opts = {};
    }
    if (typeof input !== "string") {
      throw new Error("Input must be a string");
    }
    if (opts.filename == null) {
      opts.filename = "[stdin]";
    }
    failIndex = 0;
    maxFailPos = 0;
    state = {
      input: input,
      pos: 0
    };
    if (opts.tokenize) {
      precompute(rules, tokenHandler);
    }
    result = invoke(state, Object.values(preComputedRules)[0]);
    return validate(input, result, opts);
  };
  tokenHandler = function(handler, op, name) {
    return function(_arg) {
      var value;
      value = _arg.value;
      if (value == null) {
        return value;
      }
      switch (op) {
        case "S":
          return {
            type: name,
            value: value.filter(function(v) {
              return v != null;
            }).reduce(function(a, b) {
              return a.concat(b);
            }, [])
          };
        case "L":
        case "R":
          return {
            type: name,
            value: value
          };
        case "*":
        case "+":
          return {
            type: op,
            value: value
          };
        case "?":
        case "/":
          return value;
        case "!":
        case "&":
          return {
            type: op + name,
            value: value
          };
      }
    };
  };
  generate = function(rules, vivify) {
    var m, src;
    src = "(function(create, rules) {\n  create(create, rules);\n}(" + (create.toString()) + ", " + (JSON.stringify(rules)) + "));\n";
    if (vivify) {
      m = {};
      Function("module", src)(m);
      return m.exports;
    } else {
      return src;
    }
  };
  hToS = function(h) {
    if (h == null) {
      return "";
    }
    return " -> " + (function() {
      switch (typeof h) {
        case "number":
          return h;
        case "string":
          return JSON.stringify(h);
        case "object":
          if (Array.isArray(h)) {
            return JSON.stringify(h);
          } else {
            return "\n" + (h.f.replace(/^|\n/g, "$&    "));
          }
      }
    })();
  };
  toS = function(rule, depth) {
    var f, h, terms;
    if (depth == null) {
      depth = 0;
    }
    if (Array.isArray(rule)) {
      f = rule[0];
      h = rule[2];
      switch (f) {
        case "*":
        case "+":
        case "?":
          return toS(rule[1], depth + 1) + f + hToS(h);
        case "&":
        case "!":
          return f + toS(rule[1], depth + 1);
        case "L":
          return '"' + rule[1] + '"' + hToS(h);
        case "R":
          return '/' + rule[1] + '/' + hToS(h);
        case "S":
          terms = rule[1].map(function(i) {
            return toS(i, depth + 1);
          });
          if (depth < 1) {
            return terms.join(" ") + hToS(h);
          } else {
            return "( " + terms.join(" ") + " )";
          }
          break;
        case "/":
          terms = rule[1].map(function(i) {
            return toS(i, depth && depth + 1);
          });
          if (depth === 0 && !h) {
            return terms.join("\n  ");
          } else {
            return "( " + terms.join(" / ") + " )" + hToS(h);
          }
      }
    } else {
      return rule;
    }
  };
  decompile = function(rules) {
    return Object.keys(rules).map(function(name) {
      var value;
      value = toS(rules[name]);
      return "" + name + "\n  " + value + "\n";
    }).join("\n");
  };
  precompute(rules, precompileHandler);
  return {
    decompile: decompile,
    parse: parse,
    generate: generate,
    rules: rules
  };
}, {"JSON":["S",["_",["/",["Object","Array","String","True","False","Null","Number"]],"_"]],"Object":["S",[["L","{"],"_",["?",["S",["String","_",["L",":"],"JSON",["*",["S",[["L",","],"_","String","_",["L",":"],"JSON"]]]]]],"_",["L","}"]]],"Array":["S",[["L","["],"_",["?",["S",["JSON",["*",["S",[["L",","],"JSON"]]]]]],"_",["L","]"]]],"String":["R","\"(?:\\\\.|\\\\u[0-9A-Fa-f]{4}|[^\"\\r\\n])*\""],"Number":["R","-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][-+]?[0-9]+)?"],"True":["L","true"],"False":["L","false"],"Null":["L","null"],"_":["R","\\s*"]}));

