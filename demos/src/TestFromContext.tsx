import { ContextEntryKey, ContextKey, fromContext, FromTag } from "luent";

type User = {
  name: string;
  email: string;
}

const USER = ContextKey<User>()

export function TestFromContext(setup: FromTag<{
  user?: FromContext<typeof USER>
}>) {
  const { user = fromContext(USER) } = setup;
  
  return <>
  </>
}


<TestFromContext></TestFromContext>

type FromContext<T> = T extends ContextEntryKey<infer V> ? V : never

TestFromContext