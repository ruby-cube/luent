// @ts-nocheck
import { Ion } from "@rue/quarky";
import "./styles.css";
import { Await } from "../../../packages/lumo/src/boundaries/Await";
import { component, FromTag } from "@rue/lumo";

export function TestAsyncTabs() {
   const $tab = Ion(0);
   // const [$suspense, $resolution] = Suspense() // $suspense boolean, $resolution promise

   return (<>
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
      </ul>
      {Await(<>
         <div class={{ 'tab': true, 'pending': $suspense }}>
            {Match($tab)}
            {Case(0,
               <Tab page="Uno" />
            )}
            {Case(1,
               <Tab page="Dos" />
            )}
            {Case(2,
               <Tab page="Tres" />
            )}
         </div>
      </>)}
      {Meanwhile(
         $suspense.initial ? "Loading..." : undefined // NOTE: `null` means show nothing, `undefined` means do nothing (hold whatever's on screen)
      )}
   </>);
};




const CONTENT = {
   Uno: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
   Dos: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?`,
   Tres: `On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain. These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammelled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted. The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains.`
};

function Tab(input: FromTag<{ page: string }>) {
   const { page } = input
   const [time] = RemoteIon(() => {
      return new Promise((resolve) => {
         const delay = Math.random() * 420 + 160;
         setTimeout(() => resolve(delay), delay);
      });
   }, { awaited: true });

   return component(
      <div class="tab-content">
         This content is for page "{page}" after {time()?.toFixed()}ms.
         <p>{CONTENT[page]}</p>
      </div>
   );
};

