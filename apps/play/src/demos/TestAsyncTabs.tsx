// @ts-nocheck
import { instantUpdate, Ion, swiftUpdate } from "@rue/quarky";
import "./TestAsyncTabs.css";
import { $awaiting, Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";
import { AsyncIon, component, Else, ElseIf, FromTag, If } from "@rue/lumo";

export function TestAsyncTabs() {
   const $tab = Ion(0);
   const $count = Ion(0);
   setInterval(() => {
      instantUpdate(() => {
         $count.value++
      })
   }, 1000)

   return component(<>
      <ul class="inline">
         <li class={{ selected: ($tab() === 0) }} on:click={e => $tab.value = 0}>
            Uno
         </li>
         <li class={{ selected: ($tab() === 1) }} on:click={e => $tab.value = 1}>
            Dos
         </li>
         <li class={{ selected: ($tab() === 2) }} on:click={e => $tab.value = 2}>
            Tres
         </li>
         <li class={{ selected: ($tab() === 3) }} on:click={e => $tab.value = 3}>
            Quatre
         </li>
         <li class={{ selected: ($tab() === 4) }} on:click={e => $tab.value = 4}>
            Cinq
         </li>
         <li class={{ selected: ($tab() === 5) }} on:click={e => $tab.value = 5}>
            Six
         </li>
      </ul>
      {Await(o =>
         <div class={{ 'tab': true, 'pending': (o.oo) }}>
            {/* <p>hi: {(o.oo ? 'loading...' : '')}</p> */}
            {If(($tab() === 0),
               o.await, <Tab page="Un" count={$count} />
            )}
            {ElseIf(($tab() === 1),
               o.await, <Tab page="Deux" count={$count} />
            )}
            {ElseIf(($tab() === 2),
               o.await, <Tab page="Trois" count={$count} />
            )}
            {ElseIf(($tab() === 3),
               o.await, <Tab page="Quatre" count={$count} />
            )}
            {ElseIf(($tab() === 4),
               o.await, <Tab page="Cinq" count={$count} />
            )}
            {Else(
               o.await, <Tab page="Six" count={$count} />
            )}
         </div>
      )}
      {Meanwhile(o =>
         o.initial ? "Loading..." : o.hold // NOTE: `null` means show nothing, `undefined` means do nothing (hold whatever's on screen)
      )}
      {/* {Match($tab)}
            {Case(0, (o.oo),
               <Tab page="Uno" />
            ))}
            {Case(1, (o.oo),
               <Tab page="Dos" />
            )}
            {Case(2, (o.oo),
               <Tab page="Tres" />
            )} */}
   </>);
};




const CONTENT = {
   Un: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
   Deux: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?`,
   Trois: `On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`,
   Quatre: `Quatre. On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`,
   Cinq: `Cinq. On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`,
   Six: `Six. On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`,
};

function Tab(input: FromTag<{ page: keyof typeof CONTENT, count: Ion<number> }>) {
   const { page, $count } = input
   const $time = AsyncIon(() => new Promise<number>((resolve) => {
      const delay = Math.random() * 2000;
      // const delay = Math.random() * 420 + 160;
      setTimeout(() => resolve(delay), delay);
   }), { awaited: true });

   return component(<>
      {/* {Await($time, */}
      <div class="tab-content">
         <h3>{$count}</h3>
         This content is for page "{page}" after {($time()?.toFixed())}ms.
         <p>{CONTENT[page]}</p>
      </div>
      {/* )} */}
   </>
   );
};

