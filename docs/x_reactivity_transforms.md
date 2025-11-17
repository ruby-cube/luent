Should ref variables be prefixed with $?

Yes. This indicates there's special properties about this variable

# ion and ref





```ts

type Ion<T> = T & { '~type'?: 'ion' }

type Get<T> = () => T

type MutableGet<T> = (() => T) & {state: T}

let $count = 0;

let $count = () => count

// declaration
let $count = Ion(0);

// dual nature variable
let $count = someFn(0);
let $count = someFn(0);

const countB = ($count)
const countB = $count

const $countC = ($count)
const $countC = $count

let { $count } = input


const obj = {
   count: $count
}

const obj = {
   count: ($count)
}

const obj = {
   $count
}

const $doubleCount = Ion(() => $count * 2)

const obj = {
   $count: ($count)
}

const obj = {
   count: asGet(($count))
}

const obj = withGetters({
   count: ($count)
})

const obj = {
   count: ion.asGetter(0)
}

function doSomething(getCount: () => number) {

}

doSomething(asGet(($count)))

function doSomething($count: Ion<number>){
   assertGetter($count)

   $count.value 
}

const $countB = (obj.count)

const $countB = isIonized(obj) ? obj.$count : $_derivation(() => obj.count)

// SKIP TRANSFORM

const $count = Ion(0)
// VariableDeclarator
// - id: Identifier { name }

// variable assignment
const count = ($count)
// VariableDeclarator
// - init: Identifier { name, extra: { parenthesized }}

// property assignment
const obj = {
   count: ($count)
}
// ObjectExpression
// properties [ ObjectProperty { key: Identifier, value: Identifier {name, extra }}]

// return
function doSomething($count){

   return ($count)
}
// FunctionDeclaration { id: Identifier, params: [Identifier] }
// ReturnStatement { argument: Identifier { name, extra }}

// parameter assignment
doSomething(($count))
// CallExpression { callee: Identifier, arguments: [ Identifier: { name, extra }]}



// destructuring
const { count } = obj
// VariableDeclarator { id: ObjectPattern { properties: [ ObjectProperty { key: Identifier, value: Identifier }]}, init: Identifier }

const { count: $count } = obj

const $count = obj.count
// MemberExpression { object: Identifier, property: Identifier }

const { $count } = ionizedObj // ion
const { count } = ionizedObj // value

const $count = ionizedObj.$count


// ---

// ternary
const count = isActive ? ($count) : ($other)
// ConditionalExpression

// comma
const something = (console.log('hi'), ($count))

// state assignment

$count = 0
$count += 1
// AssignmentExpression { operator: '=', left: Identifier }
// +=
// -=

++$count
$count++
// UpdateExpression { operator: "++", argument: Identifier }




// TRANSFORMS
// [ ] state access ... Identifiers except as Assignees, Callees, Params, MemberExpression
const count = $count

const count = $_value($count) // if ambiguous
const count = $count() // if definitely ref

// [ ] derivation shorthand ... Expressions with parentheses in window
($count * 2)

$_derivation(() => $count() * 2)

// [ ] ion access ... MemberExpression with parentheses in window
(frog.name)

($_is_ionized(frog) ? frog.$name : $_derivation(() => frog.name))

// [ ] state assignment ... Identifier in AssignmentExpression or UpdateExpression
$count = 0

($_is_ref($count) ? 

$_is_mutable($count)? $count.value = 0 : throw new TypeError('Assignment to immutable ref.')

: $count = 0) // if ambiguous


```






# yes




# no