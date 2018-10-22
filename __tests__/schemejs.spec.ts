import { jsEval, read, parse, Sym } from '../src/eval';

const fs = require("fs")
const path = require("path")
const code = fs.readFileSync(path.join(__dirname, "../src/util.scm"), "utf8")

describe('atom', () => {
  test('atom', () => {
    expect(1).toBe(jsEval(1));
    expect('string').toBe(jsEval('string'));
  });
});

describe('read', () => {
  it('read', () => {
    expect(read('#t')).toBeTruthy();
    expect(read('#f')).toBeFalsy();
    expect(read('12345')).toBe(12345);
    expect(read('123.45')).toBe(123.45);
    expect(read('"abcde"')).toBe('abcde');

    const r = read('(if #t 1 2)');
    expect(r.slice(1)).toEqual([true, 1, 2]);
    expect(r[0]).toEqual(Sym('if'));

    expect(read('(1 2 (3 (4) 5))')).toEqual([1, 2, [3, [4], 5]]);
  });
});

describe('parse', () => {
  it('if', () => {
    expect(parse('(if #t 1 2)')).toBe(1);
    expect(parse('(if #f 1 2)')).toBe(2);
  });
  it('begin', () => {
    expect(parse('(begin 1)')).toBe(1);
    expect(parse('(begin\n1)')).toBe(1);
    expect(parse('(begin 1 2)')).toBe(2);
  });
  it('define', () => {
    expect(parse('(define a 1)')).toBe(1);
    expect(parse('(begin (define a 1) a)')).toBe(1);
    expect(parse('(begin (define a 1) (set! a 2) a)')).toBe(2);
  });
  it('define lambda', () => {
    expect(parse('(begin (define (add) (+ 1)) (add))')).toBe(1);
    expect(parse('(begin (define (add x) (+ x 1)) (add 2))')).toBe(3);
    expect(parse('(begin (define (add x y z) (+ x y z)) (add 1 2 3))')).toBe(6);
  });
  it('let', () => {
    // expect(parse('(let 1)')).toBe();
    expect(parse('(let (a 1) (+ a 2))')).toBe(3);
    expect(parse('(let (a 1) (b 2) (c 3) (+ a b c))')).toBe(6);
  });
  it('car/cdr', () => {
    expect(parse("'(1 2 3)")).toEqual([1, 2, 3]);
    expect(parse("(car '())")).toBe(undefined);
    expect(parse("(car '(1))")).toBe(1);
    expect(parse("(car '(1 2))")).toBe(1);
    expect(parse("(car (cdr (cdr '(1 2 3))))")).toBe(3);

    expect(parse('(car (cons 1 2))')).toBe(1);
    expect(parse('(car (cdr (cons 1 2)))')).toBe(2);
    expect(parse('(car (cdr (cons 1 (cons 2 3))))')).toBe(2);
  });
});

describe('procedure', () => {
  it('procedure', () => {
    expect(parse('(+ 1 2)')).toBe(3);
    expect(parse('(- 3 2)')).toBe(1);
    expect(parse('(* 3 5)')).toBe(15);
    expect(parse('(/ 15 3)')).toBe(5);
    expect(parse('(% 11 10)')).toBe(1);
    expect(parse('(chr 97)')).toBe('a');

    expect(parse('(+ 1 2 3 4 5)')).toBe(15);
  });
  it('lambda', () => {
    expect(parse('((lambda (x) (+ x 1)) 2)')).toBe(3);
  });
});

describe('hello', () => {
  it('hello', () => {
    let stmt =
      '(begin (define msg "hello!") (define hello (lambda () msg)) (hello))';
    expect(parse(stmt)).toBe('hello!');
  });
});

describe('func', () => {
  parse(code);
  /* TODO: implement cond
  it('last', () => {
    expect(parse("(last '())")).toBe([]);
    expect(parse("(last '(1))")).toBe(1);
    expect(parse("(last '(1 2))")).toBe(2);
    expect(parse("(last '(1 2 3))")).toBe(3);
  });
  */
  it('length', () => {
    expect(parse("(length '())")).toBe(0);
    expect(parse("(length '(1))")).toBe(1);
    expect(parse("(length '(1 2))")).toBe(2);
    expect(parse("(length '(1 2 3))")).toBe(3);
  });
  it('map', () => {
    expect(parse("(map (lambda (x) (* x x)) '())")).toEqual([]);
    expect(parse("(map (lambda (x) (* x x)) '(1))")).toEqual([1]);
    expect(parse("(map (lambda (x) (* x x)) '(1 2))")).toEqual([1, 4]);
    expect(parse("(map (lambda (x) (* x x)) '(1 2 3))")).toEqual([1, 4, 9]);
  });
  /* TODO: let
  it('unique', () => {
    expect(parse("(unique '(1 2 3 1 2 3))")).toEqual([1, 2, 3]);
    expect(parse("(unique '(1 2 3 1 2))")).toEqual([1, 2, 3]);
    expect(parse("(unique '(1 2 3 1))")).toEqual([1, 2, 3]);
    expect(parse("(unique '(1 2 3))")).toEqual([1, 2, 3]);
    expect(parse("(unique '(1 2))")).toEqual([1, 2]);
    expect(parse("(unique '(1))")).toEqual([1]);
    expect(parse("(unique '())")).toEqual([]);
  });
  */
});
