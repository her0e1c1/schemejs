(define (length a)
  (if (null? a)
      0
      (+ 1 (length (cdr a)))))
