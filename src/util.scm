(begin

(define (length a)
  (if (null? a)
      0
      (+ 1 (length (cdr a)))))

(define (map f ls)
  (if (null? ls)
      '()
      (cons (f (car ls)) (map f (cdr ls)))))

)
