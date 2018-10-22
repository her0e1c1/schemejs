(begin

(define (last l)
  (cond ((null? l) '())
        ((null? (cdr l)) (car l))
        (else (last (cdr l)))))

(define (length a)
  (if (null? a)
      0
      (+ 1 (length (cdr a)))))

(define (map f ls)
  (if (null? ls)
      '()
      (cons (f (car ls)) (map f (cdr ls)))))

(define (unique a)
  (if (null? a)
      '()
      (let ((head (car a)) (tails (unique (cdr a))))
        (if (elem? head tails)
            tails
            (cons head tails)))))

)
