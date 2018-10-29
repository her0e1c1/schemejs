(begin

(define (length a)
  (if (null? a)
      0
      (+ 1 (length (cdr a)))))

(define (last l)
  (cond ((null? l) '())
        ((null? (cdr l)) (car l))
        (else (last (cdr l)))))

(define (elem? i items)
  (cond ((null? items) #f)
        ((eq? i (car items)) #t)
        (else (elem? i (cdr items)))))

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

(define (remove a alist)
  (if (null? alist)
      '()
      (let ((head (car alist))
            (tails (remove a (cdr alist))))
        (if (eq? a head)
            tails
            (cons head tails)))))

(define (append a1 a2)
  (if (null? a1) a2
      (cons (car a1) (append (cdr a1) a2))))

(define (reverse alist)
  (if (null? alist) '()
      (append (reverse (cdr alist)) (list (car alist)))))

)
