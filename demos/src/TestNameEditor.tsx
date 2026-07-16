import { $of, FromTag, NodeRef } from "@rue/luent";

export function TestNameEditor(setup: FromTag<{
  'mu:user': { name: { first: string, last: string } }
}>) {
  const { mu: { user } } = setup;

  function updateName(first: string, last: string) {
    user.name.first = first;
    user.name.last = last;
  }

  return <>
    <div>{$of(user.name).first} {$of(user.name).last}</div>
    <form
      on:submit={e => {
        e.preventDefault();
        updateName(e.target[0].value, e.target[1].value)
      }}
    >
      <label>first:</label>
      <input type='text' value={user.name.first}></input>
      <label>last:</label>
      <input type='text' value={user.name.last}></input>
      <button type="submit" hidden />
    </form>
  </>
}