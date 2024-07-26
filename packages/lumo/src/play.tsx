//@ts-nocheck

function ListItem() {
  return {};
}

function ListBlock(props: {}, attributes) {


  return {
    render: () => (
      <>
        <div class="container">
          {
            forEachIn($list, (item, i) =>
              <ListItem class="list-item">{item}</ListItem>
            )
          }
          <div>
            {$mount([
              {
                if: [$isActive,
                  <div class="list-border">
                    <ListBlock>
                      <div>
                        "hello"
                      </div>
                    </ListBlock>
                  </div>]
              },

              {
                elseIf: [$isReady, o =>
                  <p>none</p>]
              },

              {
                elseIf: [$isDone, o =>
                  <p>done</p>]
              },

              {
                else: o =>
                  'nothing'
              }
            ])}
          </div>
          <div>
            {
              $mount(() => {
                if ($isActive()) return o =>
                  <div>
                    <ListBlock>
                      <div>
                        "hello"
                      </div>
                    </ListBlock>
                  </div>

                else if ($isReady()) return o =>
                  <p>none</p>

                else if ($isDone()) return o =>
                  <p>done</p>

                else return o =>
                  'nothing'
              })
            }
          </div>
        </div>
        <dialog></dialog>
      </>
    ),
    provides: {},
  };
}





export function App(props) {
  const list = ["a", "b"]
  const active = true

  return (
    <div class='App'>
      <h1>Hello React.</h1>
      {forEachIn($list, (item, $index) =>
        <div>{item}</div>
      )}
      <h2>Start editing to see some magic happen!</h2>
      <div>
        {$activateIf($active, o =>
          <>
            <p>hey</p>
            <p>hey</p>
          </>
        )}
        {$else(o =>
          <p>hey</p>
        )}
      </div>
      <ListBlock ref={list_block}>
        {{
          $text,
          description: (o =>
            <>
              <h1>{$heading()}</h1>
              <p>{$description()}</p>
            </>
          )
        }}
      </ListBlock>
    </div>
  );
}

function forEachIn(list, fn) {
  for (const item of list) {
    fn(item)
  }
}

function $createIf(config, fn) {

}

// Log to console
console.log('Hello console')