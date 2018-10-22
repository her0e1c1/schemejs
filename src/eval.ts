// you can not define this
// type Value = ... | Value[]
interface List {
  [index: number]: Value;
}
type Atom = true | false | String | Number | Symbol;
type Value = Atom | List;

type Token = string;
// type Token = '#t' | '#f' | '(' | ')' | "'";
type EnvVal = Value | Primitive;
type Env = { [s: string]: EnvVal };
type Exp = Atom | Value | 'var' | Sym;
// atom or [Sym('if'), e1, e2, e3];
type Sym = 'if' | 'begin' | 'define' | 'set!' | 'lambda' | "'" | 'eof';
type Var = { name: string };

const symbolTable = {};

class Symbol {
  constructor(public name: Sym) {}
}
class Primitive {
  constructor(public f: (...args: any[]) => any) {}
}

class Procedure {
  constructor(public vars: Var[], public exps: Exp[], public envs: Env[]) {}
}

const fold = <T>(f: (acc: T, x: T) => T, init: T) => (...args: T[]) => {
  const list = [init];
  for (let i = 0; i < args.length; i++) {
    list[i] = args[i];
  }
  return list.reduce(f);
};
const foldr = (f, init, xs) =>
  xs.length === 0 ? init : f(xs[0], foldr(f, init, xs.slice(1)));
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
  const a = [x];
  for (let i = 0; i < y.length; i++) {
    a.push(y[i]);
  }
  return a;
};

const isEqual = (x, y): boolean => x === y;
const isNull = (x): boolean => x instanceof Array && x.length === 0;
const isPair = (x): boolean => x instanceof Array && x.length !== 0;

const theGrobalEnvironment: Env = {
  'eq?': new Primitive(isEqual),
  'null?': new Primitive(isNull),
  '+': new Primitive(fold(add2, 0)),
  '-': new Primitive(fold(sub2, 0)),
  '*': new Primitive(fold(mul2, 0)),
  '/': new Primitive(fold(div2, 0)),
  '%': new Primitive(fold(mod2, 0)),
  cons: new Primitive(cons),
  car: new Primitive(car),
  cdr: new Primitive(cdr),
  chr: new Primitive(String.fromCharCode),
  alert: new Primitive(alert),
  foldr: new Primitive(foldr),
};

export const parse = (input: string) =>
  jsEval(read(input), [theGrobalEnvironment]);

export const read = (input: string): Value => {
  const inport = new InPort(input);
  const readAhead = (token: Token) => {
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
  };
  return readAhead(inport.nextToken());
};

const atom = (token: Token): Atom => {
  if (token === '#t') {
    return true;
  } else if (token === '#f') {
    return false;
  } else if (token[0] === '"') {
    return token.substr(1, token.length - 2);
  } else if (token === 'if') {
    return Sym(token); // keyward
  } else {
    const n = Number(token);
    return isNaN(n) ? Sym(token) : n;
  }
};

class InPort {
  tokenizer = /\s*(,@|[('`,)]|"(?:[\\].|[^\\"])*"|;.*|[^\s('"`,;)]*)([\s\S]*)/;
  constructor(public input: string) {}
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

const hasKey = (key: string, json): boolean => {
  for (let k in json) {
    if (k === key) {
      return true;
    }
  }
  return false;
};

export const Sym = (str: Sym): Symbol => {
  const s = new Symbol(str);
  if (!hasKey(str, symbolTable)) {
    symbolTable[str] = s;
  }
  return symbolTable[str];
};

export const jsEval = (exp: Exp, envs: Env[] = []) => analyze(exp)(envs);

const analyze = (exp: Exp): ((envs: Env[]) => any) => {
  if (isSelfEvaluateing(exp)) {
    return analyzeSelfEvaluating(exp);
  }
  if (!isPair(exp)) {
    return analyzeLookupVariableValue(exp);
  }
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
    case Sym('cond'):
      return analyzeCond(exp);
    case Sym('let'):
      return analyzeLet(exp);
    case Sym("'"):
      return analyzeQuote(exp);
  }
  if (isPair(exp)) {
    return analyzeApplication(exp);
  }
  throw 'Unknown expression type -- EVAL ' + exp;
};

const isSelfEvaluateing = (exp: Exp): boolean =>
  typeof exp === 'string' ||
  typeof exp === 'number' ||
  typeof exp === 'boolean';

const isTrue = x => x !== false;

const analyzeSelfEvaluating = (exp: Exp) => (env: Env) => exp;

const analyzeQuote = (exp: Exp) => (envs: Env[]) => exp[1];

const analyzeIf = (exp: Exp) => {
  const pproc = analyze(exp[1]);
  const cproc = analyze(exp[2]);
  const aproc = analyze(exp[3]);
  return (envs: Env[]) => (isTrue(pproc(envs)) ? cproc(envs) : aproc(envs));
};

// (cond (p1 es1) (p2 es2) ... (else es)) =>
// (if p1 es1 (if p2 es2 (if ... es)))
const analyzeCond = (exp: Exp) =>
  analyze(
    foldr(
      (x, acc) => {
        let p = x[0];
        if (p === Sym('else')) {
          p = '#t';
        }
        return [Sym('if'), p, x[1], acc];
      },
      [],
      exp.slice(1)
    )
  );

const analyzeSequence = (exps: Exp[]) => {
  const sequentially = (p1, p2) => (envs: Env[]) => {
    p1(envs);
    return p2(envs);
  };
  const procs = exps.map(analyze);
  if (isNull(procs)) {
    throw 'Empty sequence -- ANALYZE';
  }
  let firstProc = procs[0];
  let restProc = procs.slice(1);
  while (!isNull(restProc)) {
    firstProc = sequentially(firstProc, restProc[0]);
    restProc = restProc.slice(1);
  }
  return firstProc;
};

const analyzeApplication = (exp: Exp[]) => {
  const fproc = analyze(exp[0]);
  const aprocs = exp.slice(1).map(analyze);
  return (envs: Env[]) =>
    executeApplicatoin(fproc(envs), aprocs.map(aproc => aproc(envs)));
};

const analyzeLookupVariableValue = (exp: Exp) => (envs: Env[]) =>
  lookupVariableValue(exp, envs);

const analyzeSet = (exp: Exp) => {
  const vrproc = exp[1];
  const vlproc = analyze(exp[2]);
  return (envs: Env[]) => setVariableValue(vrproc, vlproc(envs), envs);
};

const analyzeLambda = (exp: Exp) => {
  const vars = exp[1];
  const exps = analyzeSequence(exp.slice(2));
  return (envs: Env[]) => new Procedure(vars, exps, envs);
};

const analyzeDefine = (exp: Exp) => {
  if (isPair(exp[1])) {
    // (define (sym args) exps) => (define sym (lambda (args) exps))
    // exp[1].length === 0
    const sym = exp[1][0];
    const vars = exp[1].slice(1);
    const exps = exp.slice(2);
    return analyze([Sym('define'), sym, [Sym('lambda'), vars, ...exps]]);
  } else {
    const vrproc = exp[1];
    const vlproc = analyze(exp[2]);
    return (envs: Env[]) => defineVariable(vrproc, vlproc(envs), envs);
  }
};

const analyzeLet = (exp: Exp) => {
  // (let ((v1 e1) (v2 e2) ...) exps) => ((lambda (v1 v2 ...) exps) e1 e2 ...)
  const vars = [];
  const args = [];

  if (!isPair(exp[1])) {
    throw `Invalid Syntax Let`;
  }

  for (let e of exp[1]) {
    if (!isPair(e)) {
      throw `Not pair: ${e}`;
    }
    vars.push(e[0]);
    args.push(e[1]);
  }
  return analyze([[Sym('lambda'), vars, ...exp.slice(2)], ...args]);
};

const executeApplicatoin = (proc, args) => {
  // [['primitive f] args]
  // [['procedure vars exps env] args]
  if (isNull(proc)) {
    throw 'error';
  }
  const klass = proc;
  if (klass instanceof Primitive) {
    return klass.f.apply({}, args);
  } else if (klass instanceof Procedure) {
    const vars = klass.vars;
    const envs = klass.envs;
    const exps = klass.exps;
    const e = {};
    for (let i = 0; i < vars.length; i++) {
      e[vars[i].name] = args[i];
    }
    return exps([e, ...envs]);
  } else {
    throw 'Unknown procedure type -- EXECUTE-APPLICATION ' + proc;
  }
};

const lookupVariableValue = (vr: Var, envs: Env[]) =>
  envAction(
    vr,
    envs,
    env => env[vr.name],
    () => lookupVariableValue(vr, envs.slice(1))
  );

const setVariableValue = (vr: Var, vl: EnvVal, envs: Env[]) =>
  envAction(
    vr,
    envs,
    env => (env[vr.name] = vl),
    () => setVariableValue(vr, vl, envs.slice(1))
  );

const defineVariable = (vr: Var, vl: EnvVal, envs: Env[]) =>
  envAction(
    vr,
    envs,
    env => (env[vr.name] = vl),
    () => (envs[0][vr.name] = vl)
  );

const envAction = (
  vr: Var,
  envs: Env[],
  foundAction: (e: Env) => EnvVal | undefined,
  nullAction: () => void
) => {
  if (envs.length === 0) {
    throw `Unbouned variable: ${vr.name}`;
  }
  // In each action you can access at least one environment
  for (let i = 0; i < envs.length; i++) {
    let e = envs[i];
    if (hasKey(vr.name, e)) {
      return foundAction(e);
    }
  }
  return nullAction();
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.parse = parse;
}
