import { jsEval, read, parse, Sym } from '../src/eval';

const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '../src/util.scm'), 'utf8');

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
  it('read error', () => {
    // expect(read('(')).toThrowError(Error);
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
    expect(parse('(let ((a 1)) (+ a 2))')).toBe(3);
    expect(parse('(let ((a 1) (b 2) (c 3)) (+ a b c))')).toBe(6);
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

describe('primitive', () => {
  it('eq?', () => {
    expect(parse('(eq? 1 1)')).toBeTruthy();
    expect(parse('(eq? "abc" "abc")')).toBeTruthy();
  });
});

describe('func', () => {
  parse(code);
  it('length', () => {
    expect(parse("(length '())")).toBe(0);
    expect(parse("(length '(1))")).toBe(1);
    expect(parse("(length '(1 2))")).toBe(2);
    expect(parse("(length '(1 2 3))")).toBe(3);
  });
  it('last', () => {
    expect(parse("(last '())")).toEqual([]);
    expect(parse("(last '(1))")).toBe(1);
    expect(parse("(last '(1 2))")).toBe(2);
    expect(parse("(last '(1 2 3))")).toBe(3);
  });
  it('elem?', () => {
    expect(parse("(elem? 1 '())")).toBeFalsy();
    expect(parse("(elem? 1 '(1 2 3))")).toBeTruthy();
    expect(parse("(elem? 2 '(1 2 3))")).toBeTruthy();
    expect(parse("(elem? 3 '(1 2 3))")).toBeTruthy();
    expect(parse("(elem? 4 '(1 2 3))")).toBeFalsy();
  });
  it('map', () => {
    expect(parse("(map (lambda (x) (* x x)) '())")).toEqual([]);
    expect(parse("(map (lambda (x) (* x x)) '(1))")).toEqual([1]);
    expect(parse("(map (lambda (x) (* x x)) '(1 2))")).toEqual([1, 4]);
    expect(parse("(map (lambda (x) (* x x)) '(1 2 3))")).toEqual([1, 4, 9]);
  });
  it('unique', () => {
    expect(parse("(unique '(1 2 3 1 2 3))")).toEqual([1, 2, 3]);
    expect(parse("(unique '(1 2 3 1 2))")).toEqual([3, 1, 2]); // need to reorder
    expect(parse("(unique '(1 2 3 1))")).toEqual([2, 3, 1]); // ditto
    expect(parse("(unique '(1 2 3))")).toEqual([1, 2, 3]);
    expect(parse("(unique '(1 2))")).toEqual([1, 2]);
    expect(parse("(unique '(1))")).toEqual([1]);
    expect(parse("(unique '())")).toEqual([]);
  });
  it('remove', () => {
    expect(parse("(remove 4 '(1 2 3))")).toEqual([1, 2, 3]);
    expect(parse("(remove 1 '(1 2 3))")).toEqual([2, 3]);
    expect(parse("(remove 1 '(1 2))")).toEqual([2]);
    expect(parse("(remove 1 '(1))")).toEqual([]);
    expect(parse("(remove 1 '())")).toEqual([]);
    expect(parse("(remove 1 '(1 2 3 1))")).toEqual([2, 3]);
  });
  it('reverse', () => {
    expect(parse("(reverse '())")).toEqual([]);
    expect(parse("(reverse '(1))")).toEqual([1]);
    expect(parse("(reverse '(1 2))")).toEqual([2, 1]);
    expect(parse("(reverse '(1 2 3))")).toEqual([3, 2, 1]);
  });
  it('flatten', () => {
    const e = [1, 2, 3, 4, 5, 6];
    expect(parse("(flatten '(1 2 3 4 5 6))")).toEqual(e);
    expect(parse("(flatten '((1 2 3) (4 5) (6)))")).toEqual(e);
    expect(parse("(flatten '((1 2 3) (4 5) (6)))")).toEqual(e);
    expect(parse("(flatten '(1 2 3 (4 5) 6))")).toEqual(e);
    expect(parse("(flatten '(((1) 2 3) ((4 5) 6)))")).toEqual(e);
  });
});
