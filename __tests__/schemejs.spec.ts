import { jsEval, read, parse, Sym } from '../src/eval';

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
