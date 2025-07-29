# Array
Bind to proxy + trigger indices that are greater than new length

# Mutating
## push
get length
set 5 6
set length 6

## pop ** (missing set 5 undefined)
get length
get 5
set length 5

## shift (missing set 4 undefined)
get length
get 0
get 1
set 0 2
get 2
set 1 3
get 3
set 2 4
get 4
set 3 5
set length 4

## unshift
get length
get 3
set 4 5
get 2
set 3 4
get 1
set 2 3
get 0
set 1 2
set 0 0
set length 5

## splice (missing set 4 undefined)
get length
get constructor
get 2
get 3
set 2 4
get 4
set 3 5
set length 4

## sort
get length
get 0
get 1
get 2
get 3
set 0 0
set 1 2
set 2 4
set 3 5

## reverse
get length
get 0
get 3
set 0 5
set 3 0
get 1
get 2
set 1 4
set 2 2

## fill
get length
set 1 1
set 2 1

## copyWithin
get length
get 2
set 1 1
get 3
set 2 0
Proxy(Array) {0: 5, 1: 1, 2: 0, 3: 0}


# Non Mutating

## concat
get constructor
get Symbol(Symbol.isConcatSpreadable)
get length
get 0
get 1
get 2
get 3
get 4

## slice
get length
get constructor
get 1
get 2

## map
get length
get constructor
get 0
get 1
get 2
get 3
get 4

## filter
get length
get constructor
get 0
get 1
get 2
get 3
get 4

## reduce
get length
get 0
get 1
get 2
get 3
get 4

## find
get length
get 0
get 1
get 2
get 3

## findIndex
get length
get 0
get 1
get 2
get 3

## includes
get length
get 0
get 1
get 2

## indexOf
get length
get 0
get 1
get 2

## lastIndexOf
get length
get 4
get 3
get 2

## every
get length
get 0
get 1
get 2
get 3
get 4

## some
get length
get 0
get 1
get 2
get 3
get 4

## join
get length
get 0
get 1
get 2
get 3
get 4

## toString
get join
get length
get 0
get 1
get 2
get 3
get 4

## flatMap
get length
get constructor
get 0
get 1
get 2
get 3
get 4

## entries
get length
get 0
get length
get 1
get length
get 2
get length
get 3
get length
get 4
get length

## keys
get length x6

## values
get length
get 0
get length
get 1
get length
get 2
get length
get 3
get length
get 4
get length

## flat
get length
get constructor
get 0
get 1
get 2

----

# Set & Map
Bind to target, configure what gets triggered according to args and op

## add
TypeError: Method Set.prototype.add called on incompatible receiver #

## delete
TypeError: Method Set.prototype.delete called on incompatible receiver #

## clear
TypeError: Method Set.prototype.clear called on incompatible receiver #

## entries
incompatible receiver

## values
incompatible receiver

## keys
incompatible receiver