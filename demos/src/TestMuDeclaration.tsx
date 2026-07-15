type User = { name: string }

function Foo(user: User) {
  user.name = ''
}
Foo.__mu__ = [0] as const