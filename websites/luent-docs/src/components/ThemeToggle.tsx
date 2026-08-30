
import { ion, type Ion } from "luent";
import { ThemeToggle as Toggle } from "@luent/luent-ui";

export function ThemeToggle() {
  const $theme = ion("dark" as "dark" | "light", {
    toggle() {
      $theme.value = $theme() === "dark" ? "light" : "dark";
    },
  });
  return <>
    <o--body class={$theme}/>
    <Toggle on:click={$theme.toggle} />
  </>
}

// function toggleTheme($theme: Ion<'dark' | 'light'> & { toggle: () => void }) {
//   console.log('toggle theme')
//   $theme.toggle()
//   if ($theme() === 'dark') document.body.classList.add('dark')
//   else document.body.classList.remove('dark')
// }