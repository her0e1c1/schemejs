type Value = null | true | false | Number | String;
type Token = '#t' | '#f' | '(' | ')' | "'";

const fold = <T>(f: (acc: T, x: T) => T, init: T) => (...args: T[]) => {
  const list = [init];
  for (let i = 0; i < args.length; i++) {
    list[i] = args[i];
  }
  return list.reduce(f);
};
const add2 = (x: number, y: number): number => x + y;
const sub2 = (x: number, y: number): number => x - y;
const mul2 = (x: number, y: number): number => x * y;
const div2 = (x: number, y: number): number => x / y;
const mod2 = (x: number, y: number): number => x % y;
const car = <T>(xs: T[]): T => xs[0];
const cdr = <T>(xs: T[]): T[] => xs.slice(1);
const alert = (x: string) => window !== undefined && window.alert(x);
const cons = (x, y) => {
  // TODO: dotted list
  if (y.constructor !== Array) {
    return [x, y];
  }

  var a = [x];
  for (var i = 0; i < y.length; i++) {
    a.push(y[i]);
  }
  return a;
};

class Primitive {
  className = 'Primitive';
  f(...args: any[]): any;
  constructor(f) {
    this.f = f;
  }
}

class Procedure {
  className = 'Procedure';
  constructor(vars, exps, envs) {
    this.vars = vars;
    this.exps = exps;
    this.envs = envs;
  }
}

const theGrobalEnvironment = [
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

export const parse = (input: string) =>
  jsEval(read(input), theGrobalEnvironment);

export const read = (input: string): Value => {
  const inport = new InPort(input);

  function readAhead(token: Token) {
    if (token === '(') {
      const L = [] as string[];
      while (true) {
        const t = inport.nextToken();
        if (t === ')') {
          return L;
        } else {
          L.push(readAhead(t));
        }
      }
    } else if (token === "'") {
      return [Sym("'"), readAhead(inport.nextToken())];
    } else if (token === Sym('eof')) {
      throw 'Unexpected EOF';
    } else {
      return atom(token);
    }
  }
  return readAhead(inport.nextToken());
};

const atom = (token: Token) => {
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
};

class InPort {
  className = 'InPort';
  tokenizer = /\s*(,@|[('`,)]|"(?:[\\].|[^\\"])*"|;.*|[^\s('"`,;)]*)([\s\S]*)/;
  constructor(public input: string) {
    this.input = input;
  }
  nextToken(): Token | undefined {
    if (this.input === '') {
      return Sym('eof');
    } else {
      const match = this.input.match(this.tokenizer);
      if (!match) {
        throw `ERROR: ${this.input}`;
      }
      const m1 = match[1];
      const m2 = match[2];
      this.input = m2;
      if (m1 !== '' && m1[0] !== ';') {
        return m1;
      }
    }
  }
}

const symbolTable = {};

class Symbol {
  className = 'Symbol';
  name: string;
  constructor(str) {
    this.name = str;
  }
}

const hasKey = (key: string, json): boolean => {
  for (var k in json) {
    if (k === key) {
      return true;
    }
  }
  return false;
};

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
    throw 'Unexpected undefined object';
  } else if (x.name !== undefined) {
    return false;
  }
  return (x.constructor === Array && x.length !== 0) || false;
}

export const jsEval = (exp, env) => analyze(exp)(env);

const analyze = exp => {
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
};

const isSelfEvaluateing = (exp): boolean => {
  const t = typeof exp;
  return t === 'string' || t === 'number' || t === 'boolean' || false;
};

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

const setVariableValue = (vr, vl, envs) => {
  const foundAction = env => {
    env[vr.name] = vl;
  };

  function nullAction() {
    setVariableValue(vr, vl, envs.slice(1));
  }
  envAction(vr, envs, foundAction, nullAction);
};

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
