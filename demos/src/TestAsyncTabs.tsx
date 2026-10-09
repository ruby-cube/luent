import "./TestAsyncTabs.css";
import { Ion, ion, ionic, Await, Meanwhile, Default, For, As, FromTag } from "luent";

// Modified Demo from Solid.js 

export function TestAsyncTabs() {
  const tabNames = ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six'] as const
  const tabViews: any[] = []
  const allTabs = [0, 1, 2, 3, 4, 5]
  const openTabs = ionic([0, 1, 2, 3, 4, 5])
  const $tab = ion(0);
  const $count = ion(0);

  function openTab(tab: number) {
    if (openTabs.indexOf(tab) === -1) {
      openTabs.push(tab)
    }
    $tab.value = tab
  }

  function closeTab(tab: number) {
    tabViews[tab]?.markDiscard()
    const index = openTabs.indexOf(tab)
    if ($tab() === tab) {
      $tab.value = openTabs[index + 1] ?? openTabs[index - 1]
    }
    openTabs.splice(openTabs.indexOf(tab), 1)
  }

  setInterval(() => {
    $count.value++
  }, 1000)

  return <>
    <div class="async-tabs-layout">
      <aside class="all-tabs-sidebar">
        <h4>Pages</h4>
        <ul class="all-tabs-list">
          {For(allTabs, m => m, tab => (
            <li class={() => $tab() === tab && 'selected'} on:click={() => { openTab(tab) }}>
              {tabNames[tab]}
            </li>
          ))}
        </ul>
      </aside>
      <main>
      {Await((view: any) => <>
        <section class="tab-panel">
          <ul class="inline open-tabs-inline">
            {For(openTabs, m => m, tab => (
              <li class={() => $tab() === tab && 'selected'} on:click={e => { !e.from('span') && ($tab.value = tab) }}>
                {tabNames[tab]}
                <span style="padding: 1em" on:click={() => closeTab(tab)}>x</span>
              </li>
            ))}
          </ul>
          <div class={() => `tab ${view.ifPending('pending')}`}>
            <o:preserve>
              {As($tab, (view: any) =>
                <div before:attach={() => tabViews[$tab()] = view}>
                  <Tab page={tabNames[$tab()]} count={$count} />
                </div>
              )}
              {Default(
                <div>No tabs open</div>
              )}
            </o:preserve>
          </div>
        </section>
      </>)}
      {Meanwhile(
        <p class='loader'>loading...</p>
      )}
      </main>
    </div>
  </>
};




const CONTENT = {
  Un: `All by myself... 😭`,
  Deux: `Two peas in a pod 🤢🤢`,
  Trois: `🙈 🙉 🙊 ...no evil`,
  Quatre: `🌸 🌺 🍄 🍀`,
  Cinq: `🌾 🌰 🍂 🐌 🍁`,
  Six: `🎲`
};

function Tab(input: FromTag<{
  page: keyof typeof CONTENT,
  count: Ion<number>
}>) {
  const { page, $count } = input

  const $localCount = ion(0, {
    increment() {
      this.value++
    }
  })

  const $time = ion(undefined, {
    '-fetch': db.fetchTime,
    // '-awaited': true
  });

  return <>
    <div class="tab-content" animate-in>
      <p style="font-size: xx-large">{CONTENT[page]}</p>
      <p>
      Page <b>{page}</b> loaded after <b>{() => $time()?.toFixed()}ms</b>. Time elapsed since initial load: <b>{$count}s</b>.
      </p>
      Local persisted state (resets when tab is closed): 
      <button on:click={e => $localCount.increment()}>{$localCount}</button>
    </div>
  </>
};

const db = {
  fetchTime() {
    return new Promise<number>((resolve) => {
      const delay = Math.random() * 1000;
      setTimeout(() => resolve(delay), delay);
    })
  }
}