
import { ion } from "luent";
import { ThemeToggle as Toggle } from "@luent/luent-ui";

export function ThemeToggle() {
  console.log('ThemeToggle')
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