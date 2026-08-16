import { css, ion, Style } from "luent";
import { ThemeToggle } from "./components/ThemeToggle";
import { Counter } from "./components/Counter";
import { AtomIcon } from "./components/AtomIcon";

export function App() {
  const $theme = ion('dark' as 'dark' | 'light', {
    toggle() {
      $theme.value = $theme() === 'dark'
        ? 'light'
        : 'dark'
    }
  })
  return <>
    <o--body class={$theme} />
    <header>
      <ThemeToggle on:click={() => $theme.toggle()} />
    </header>

    <main>
      <AtomIcon />
      <h1>A fresh start.</h1>
      <p class="lede" style="text-wrap: balance;">Below is a simple demo of reactivity based on ions. Edit and save <code>src/App.tsx</code> to update this page.</p>
      <Counter />
    </main>

    <footer>
      <a class="built-with" href="https://luent.dev" target="_blank" rel="noopener noreferrer">
        <img class="mark"
          src="/src/assets/luent-logo-512px.png"
          alt="Luent logo" width="215" height="240" />
        <span>Built with Luent</span>
      </a>
      <span class="div" aria-hidden="true"></span>
      <span class="ver">v0.0.1</span>
    </footer>

    {Style(css`
      .orb {
        width: 112px;
        height: 112px
      }
    `)}
  </>
}