import { App } from "./literalHTML/App"

const app = document.querySelector('#app')

app!.innerHTML = App().render()