const symbolTable = {};

function fold(f, init) {
  return function() {
    var list = [init];
    for (var i = 0; i < arguments.length; i++) {
      list[i] = arguments[i];
    }
    return list.reduce(f);
  };
}

const add2 = (x, y) => x + y;

function sub2(x, y) {
  return x - y;
}

function mul2(x, y) {
  return x * y;
}

function div2(x, y) {
  return x / y;
}

function mod2(x, y) {
  return x % y;
}

function cons(x, y) {
  // TODO: dotted list
  if (y.constructor !== Array) {
    return [x, y];
  }

  var a = [x];
  for (var i = 0; i < y.length; i++) {
    a.push(y[i]);
  }
  return a;
}

function car(x) {
  return x[0];
}

function cdr(x) {
  return x.slice(1);
}

class Primitive {
  className = 'Primitive';
  f(...args: any[]): any;
  constructor(f) {
    this.f = f;
  }
}

class Procedure {
  className = 'Procedure';
  constructorn(vars, exps, envs) {
    this.vars = vars;
    this.exps = exps;
    this.envs = envs;
  }
}

function alert(x) {
  if (window !== undefined) window.alert(x);
}

var theGrobalEnvironment = [
  {
    '+': new Primitive(fold(add2, 0)),
  },
  {
    '-': new Primitive(fold(sub2, 0)),
  },
  {
    '*': new Primitive(fold(mul2, 0)),
  },
  {
    '/': new Primitive(fold(div2, 0)),
  },
  {
    '%': new Primitive(fold(mod2, 0)),
  },
  {
    cons: new Primitive(cons),
  },
  {
    car: new Primitive(car),
  },
  {
    cdr: new Primitive(cdr),
  },
  {
    chr: new Primitive(String.fromCharCode),
  },
  {
    alert: new Primitive(alert),
  },
];

export function parse(input) {
  return jsEval(read(input), theGrobalEnvironment);
}

export function read(input) {
  var inport = new InPort(input);

  function readAhead(token: string) {
    if (token === '(') {
      var L = [] as string[];
      while (true) {
        var t = inport.next_token();
        if (t === ')') {
          return L;
        } else {
          L.push(readAhead(t));
        }
      }
    } else if (token === "'") {
      return [Sym("'"), readAhead(inport.next_token())];
    } else if (token === Sym('eof')) {
      throw 'Unexpected EOF';
    } else {
      return atom(token);
    }
  }
  return readAhead(inport.next_token());
}

function atom(token) {
  if (token === '#t') {
    return true;
  } else if (token === '#f') {
    return false;
  } else if (token[0] === '"') {
    return token.substr(1, token.length - 2);
  } else {
    var n = Number(token);
    return isNaN(n) ? Sym(token) : n;
  }
}

class InPort {
  className = 'InPort';
  tokenizer = /\s*(,@|[('`,)]|"(?:[\\].|[^\\"])*"|;.*|[^\s('"`,;)]*)([\s\S]*)/;
  constructor(public input: string) {
    this.input = input;
  }
  next_token() {
    if (this.input === '') {
      return Sym('eof');
    } else {
      var match = this.input.match(this.tokenizer);
      var m1 = match[1];
      var m2 = match[2];
      this.input = m2;
      if (m1 !== '' && m1[0] !== ';') {
        return m1;
      }
    }
  }
}

class Symbol {
  className = 'Symbol';
  name: string;
  constructor(str) {
    this.name = str;
  }
}

function hasKey(key, json) {
  for (var k in json) {
    if (k === key) {
      return true;
    }
  }
  return false;
}

export function Sym(str) {
  var s = new Symbol(str);
  if (!hasKey(str, symbolTable)) {
    symbolTable[str] = s;
  }
  return symbolTable[str];
}

function isNull(x) {
  return (x.constructor === Array && x.length === 0) || false;
}

function isPair(x) {
  if (x === undefined) {
    throw 'Unepected undefined object';
  } else if (x.name !== undefined) {
    return false;
  }
  return (x.constructor === Array && x.length !== 0) || false;
}

export function jsEval(exp, env) {
  return analyze(exp)(env);
}

function analyze(exp) {
  if (isSelfEvaluateing(exp)) {
    return analyzeSelfEvaluating(exp);
  }
  if (!isPair(exp)) {
    return analyzeLookupVariableValue(exp);
  }
  // exp is not an atom but a list
  switch (exp[0]) {
    case Sym('if'):
      return analyzeIf(exp);
    case Sym('begin'):
      return analyzeSequence(exp.slice(1));
    case Sym('define'):
      return analyzeDefine(exp);
    case Sym('set!'):
      return analyzeSet(exp);
    case Sym('lambda'):
      return analyzeLambda(exp);
    case Sym("'"):
      return analyzeQuote(exp);
  }

  if (isPair(exp)) {
    return analyzeApplication(exp);
  }
  throw 'Unknown expression type -- EVAL ' + exp;
}

function isSelfEvaluateing(exp) {
  const t = typeof exp;
  return t === 'string' || t === 'number' || t === 'boolean' || false;
}

function isTrue(x) {
  return x !== false;
}

function analyzeSelfEvaluating(exp) {
  return function(env) {
    return exp;
  };
}

function analyzeIf(exp) {
  var pproc = analyze(exp[1]);
  var cproc = analyze(exp[2]);
  var aproc = analyze(exp[3]);
  return function(env) {
    if (isTrue(pproc(env))) {
      return cproc(env);
    } else {
      return aproc(env);
    }
  };
}

function analyzeQuote(exp) {
  var e = exp[1];
  return function(env) {
    return e;
  };
}

function analyzeSequence(exps) {
  function sequentially(proc1, proc2) {
    return function(env) {
      proc1(env);
      return proc2(env);
    };
  }
  var procs = exps.map(analyze);
  if (isNull(procs)) {
    throw 'Empty sequence -- ANALYZE';
  }
  var firstProc = procs[0];
  var restProc = procs.slice(1);
  while (!isNull(restProc)) {
    firstProc = sequentially(firstProc, restProc[0]);
    restProc = restProc.slice(1);
  }
  return firstProc;
}

function analyzeApplication(exp) {
  var fproc = analyze(exp[0]);
  var aprocs = exp.slice(1).map(analyze);
  return function(env) {
    return executeApplicatoin(
      fproc(env),
      aprocs.map(function(aproc) {
        return aproc(env);
      })
    );
  };
}

function analyzeLookupVariableValue(exp) {
  var vrproc = exp;
  return function(envs) {
    if (exp.constructor === Array && vrproc[0].constructor === Function) {
      return;
    }
    return lookupVariableValue(vrproc, envs);
  };
}

function analyzeDefine(exp) {
  var vrproc = exp[1];
  var vlproc = analyze(exp[2]);
  return function(envs) {
    return defineVariable(vrproc, vlproc(envs), envs);
  };
}

function analyzeSet(exp) {
  var vrproc = exp[1];
  var vlproc = analyze(exp[2]);
  return function(envs) {
    return setVariableValue(vrproc, vlproc(envs), envs);
  };
}

function analyzeLambda(exp) {
  var vars = exp[1];
  var exps = analyzeSequence(exp.slice(2));
  return function(envs) {
    return new Procedure(vars, exps, envs);
  };
}

function executeApplicatoin(proc, args) {
  // [['primitive f] args]
  // [['procedure vars exps env] args]
  if (isNull(proc)) {
    throw 'error';
  }
  var klass = proc;
  if (klass.className === 'Primitive') {
    return klass.f.apply({}, args);
  } else if (klass.className === 'Procedure') {
    var vars = proc.vars;
    var env = proc.envs;
    var exps = proc.exps;

    var e = {};
    for (var i = 0; i < vars.length; i++) {
      e[vars[i].name] = args[i];
    }
    env.unshift(e);
    // var newEnv = extendEnviroment(vars, args, env);
    return exps(env);
  } else {
    throw 'Unknown procedure type -- EXECUTE-APPLICATION ' + proc;
  }
}

/*
  The structure of environment is a list of jsons.
 */
function lookupVariableValue(vr, envs) {
  function foundAction(env) {
    return env[vr.name];
  }

  function nullAction() {
    lookupVariableValue(vr, envs.slice(1));
  }
  return envAction(vr, envs, foundAction, nullAction);
}

function setVariableValue(vr, vl, envs) {
  function foundAction(env) {
    env[vr.name] = vl;
  }

  function nullAction() {
    setVariableValue(vr, vl, envs.slice(1));
  }
  envAction(vr, envs, foundAction, nullAction);
}

function defineVariable(vr, vl, envs) {
  function foundAction(env) {
    env[vr.name] = vl;
  }

  function nullAction() {
    foundAction(envs[0]);
  }
  envAction(vr, envs, foundAction, nullAction);
}

function envAction(vr, envs, foundAction, nullAction) {
  if (envs.length === 0) {
    throw 'Unbouned variable';
  }
  // In each action you can access at least one environment
  for (var i = 0; i < envs.length; i++) {
    var e = envs[i];
    if (hasKey(vr.name, e)) {
      return foundAction(e);
    }
  }
  return nullAction();
}

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.parse = parse;
}
