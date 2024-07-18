import { createApp } from '../packages/lumo/createApp';
import { App } from './App';
import './style.css'

const app = createApp(App)

app.mount('#app')

// const sideBarSlot = document.querySelector('#real');
const sideBarSlot = document.querySelector('side-bar');
console.log(sideBarSlot)
const sideBar = document.querySelector('#side-bar') as HTMLTemplateElement

sideBarSlot?.replaceWith(sideBar.content.cloneNode(true))