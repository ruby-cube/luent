import './index.css'
import { FromTag, Ion, RenderTag } from "luent";

export function TestNamedSlots() {

  return <>
    <div class='p-10 border border-emerald-800'>
      <Comp
        Title={() =>
          <h1>Stormy Night</h1>
        }
        Description={() =>
          <p>Lorem ipsum de fulctus</p>
        }
      />
    </div>
  </>
}

function Comp(setup: FromTag<{
  Title: RenderTag<{ dog: Ion<true> }>;
  Description: RenderTag;
}>) {
  const { Title, Description } = setup;

  return <>
    <div>
      <Title dog={true} />
      <hr></hr>
      <Description />
    </div>
  </>
}



