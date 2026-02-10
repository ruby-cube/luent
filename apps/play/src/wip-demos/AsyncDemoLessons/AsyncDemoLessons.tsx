import "./index.css";
import "./debugger.css";
import { AsyncIon, component, Else, For, FromTag, HandleEvent, If, RenderSlot, Suspense } from "@rue/lumo";
import * as db from "./data/index"
import { Ion } from "@rue/quarky";
import { Await, Meanwhile, Nonce } from "../../../../../packages/lumo/src/boundaries/Await";
import { Action } from "../../../../../packages/quarky/src/async/Action";



export function AsyncDemoLessons() {
   return component(
      <Home></Home>
   );
}


function Home() {

   const $searchTerm = Ion("")
   const $tab = Ion("")

   // function searchAction(value) {
   //    router.setParams("q", value);
   // }

   // function tabAction(value) {
   //    router.setParams("tab", value);
   // }
   const $suspense = Suspense()


   return component(
      <>
         {/*
         Design.SearchInput is using the action prop pattern to automatically 
         show a loading state while the action is pending (delayed by 1.5s).
         The input state is updated with useOptimistic so it updates immediately
         while the transition to the new URL is pending.
      */}
         <SearchInput value={$searchTerm} on:change={searchAction} />
         {/*
         Design.TabList is using the action prop pattern to optimistically 
         update the selected tab while the action is pending. If the action 
         takes longer than 150ms, it automatically shows a loading state on
         the tab, so the user knows their optimistic tab is still loading.
      */}
         <TabList activeTab={$tab} on:change={e => { }} contentPending={$suspense}>
            {/*
           This fallback will be shown when the LessonList suspends initially.
           It will not be show again, like when switching tabs or searching,
           because those updates are wrapped in transitions. Instead of showing
           the fallback again, the list will be updated in the background and
           the optimistic/pending states will be used to show loading instead.
        */}
            {Await($suspense,
               <LessonList
                  tab={$tab}
                  search={$searchTerm}
                  suspense={$suspense}
               />
            )}
            {Nonce(<Skeleton />)}
         </TabList>
      </>
   );
}



export function TabList(input: FromTag<{
   activeTab: Ion<string>,
   'on:change': HandleEvent,
   Slot: RenderSlot,
   contentPending: Suspense
}>) {
   const { $activeTab, emit, Slot, $contentPending } = input

   return (
      <Tabs
         activationMode="manual"
         value={$activeTab}
         on:valuechange={e => emit('change')}
         class="relative w-full h-full"
      >
         <div class="px-8">
            <TabsList class="w-full">
               <TabsTrigger value="all" class="relative overflow-hidden">
                  All
                  <ButtonShimmer isPending={$contentPending() && $activeTab() === "all"} />
               </TabsTrigger>
               <TabsTrigger value="wip" class="relative overflow-hidden">
                  In Progress
                  <ButtonShimmer isPending={$contentPending()  && $activeTab() === "wip"} />
               </TabsTrigger>
               <TabsTrigger value="done" class="relative overflow-hidden">
                  Complete
                  <ButtonShimmer isPending={($contentPending()  && $activeTab() === "done")} />
               </TabsTrigger>
            </TabsList>
         </div>
         {Slot()}
      </Tabs>
   );
}


function LessonList({ $tab, $search, $pending }: FromTag<{ tab: Ion<string>, search: Ion<string>, pending: Suspense }>) {
   /**
    * data.getLessons is a suspense-enabled data fetching function.
    * It returns a cached promise that fetched the first time it's called
    * with a given tab+search, then it returns the resolved data on subsequent calls.
    *
    * Since it's cached, there needs to be a way to clear the cache and re-fetch the data,
    * like after a mutation like toggling complete. This is done with the data.revalidate() function,
    * which is called in the completeAction below.
    *
    * The use(data.getLessons(...)) call here will suspend the component
    * until the promise resolves, then return the resolved data.
    */
   // const lessons = use(data.getLessons(tab, search));

   const $lessons = AsyncIon(() => db.getLessons($tab(), $search()), { suspense: $pending })

   return component(
      <>
         {If(($lessons().length === 0),
            <EmptyList />
         )}
         {Else(
            <List>
               {For($lessons, m => m.id, lesson =>
                  <div>
                     <Lesson
                        id={lesson.id}
                        item={lesson}
                        can:toggleCompleted={toggleCompleted}
                     />
                  </div>
               )}
            </List>
         )}
      </>
   )
}

function Lesson({ id, item, toggleCompleted }) {

   return (
      <LessonCard item={item}>
         <CompleteButton
            mu:completed={item.$complete}
         ></CompleteButton>
      </LessonCard>
   );
}


export function SearchInput(input: FromTag<{ value: string, 'on:change': HandleEvent }>) {
   const { value, emit } = input
   const [inputValue, setInputValue] = useOptimistic(value);
   const isPending = inputValue !== value;

   function handleChange(e) {
      const newValue = e.target.value;
      startTransition(async () => {
         setInputValue(newValue);
         await changeAction(newValue);
      });
   }

   return (
      <div class="px-8">
         <InputGroup class="relative overflow-hidden">
            <InputGroupInput
               placeholder="Search..."
               value={inputValue}
               on:change={handleChange}
            />
            <InputGroupAddon>
               <SearchIcon />
            </InputGroupAddon>
            <InputGroupAddon
               align="inline-end"
               class={cn("pending", { "isPending long": isPending })}
            >
               <Spinner />
            </InputGroupAddon>
            <ButtonShimmer isPending={isPending} long />
         </InputGroup>
      </div>
   );
}


export function CompleteButton({ $completed }: FromTag<{ 'mu:completed': Ion<boolean> }>) {
   const toggleCompleted = Action((id: string) => {
      storeRollback($completed(), prev => {
         $completed.value = prev
      })
      $completed.value = !$completed()
      db.toggleCompleted(id)}, 
   () => $lessons.refetch())

   return (
      <PendingButton action={clickAction}>
         {optimisticComplete ? (
            <CircleCheckBig
               class={cn({ "text-chart-2": optimisticComplete })}
               size={48}
            />
         ) : (
            <div></div>
         )}
      </PendingButton>
   );
}
