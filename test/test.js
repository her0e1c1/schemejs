/* jshint undef: false */

var _ = require('underscore');
var assert = require('assert');
var ae = require('../src/eval.js');

describe('atom', function() {
    it('atom', function() {
        assert.equal(1, ae.jsEval(1, {}));
        assert.equal('string', ae.jsEval('string', {}));
    });
});

describe('read', function() {
    it('read', function() {
        assert.equal(true, ae.read('#t'));
        assert.equal(false, ae.read('#f'));
        assert.equal(12345, ae.read('12345'));
        assert.equal(123.45, ae.read('123.45'));
        assert.equal('abcde', ae.read('"abcde"'));

        var r = ae.read('(if #t 1 2)');
        assert.equal(true, _.isEqual([true, 1, 2], r.slice(1)));
        assert.equal(ae.Sym('if'), r[0]);

        assert.equal(true, _.isEqual([1, 2, [3, [4], 5]],
                                    ae.read('(1 2 (3 (4) 5))')));
    });
});

describe('eval', function() {
    it('eval', function() {
        assert.equal(1, ae.parse('(if #t 1 2)'));
        assert.equal(2, ae.parse('(if #f 1 2)'));
        assert.equal(1, ae.parse('(begin 1)'));
        assert.equal(1, ae.parse('(begin\n1)'));
        assert.equal(2, ae.parse('(begin 1 2)'));
        assert.equal(undefined, ae.parse('(define a 1)'));
        assert.equal(1, ae.parse('(begin (define a 1) a)'));
        assert.equal(2, ae.parse('(begin (define a 1) (set! a 2) 2)'));
        assert.equal(true, _.isEqual([1,2,3], ae.parse("'(1 2 3)")));
        assert.equal(1, ae.parse("(car '(1 2 3))"));
        assert.equal(3, ae.parse("(car (cdr (cdr '(1 2 3))))"));
        assert.equal(1, ae.parse("(car (cons 1 2))"));
        assert.equal(2, ae.parse("(car (cdr (cons 1 2)))"));
        assert.equal(2, ae.parse("(car (cdr (cons 1 (cons 2 3))))"));
    });
});

describe('procedure', function() {
    it('procedure', function() {
        assert.equal(3, ae.parse('(+ 1 2)'));
        assert.equal(1, ae.parse('(- 3 2)'));
        assert.equal(15, ae.parse('(* 3 5)'));
        assert.equal(5, ae.parse('(/ 15 3)'));
        assert.equal(1, ae.parse('(% 11 10)'));
        assert.equal(15, ae.parse('(+ 1 2 3 4 5)'));
        assert.equal(3, ae.parse('((lambda (x) (+ 1 x)) 2)'));
        assert.equal('a', ae.parse('(chr 97)'));
    });
});
