import { createApp } from '../../../packages/lumo/src';
import { App } from './App';
import './style.css'

const app = createApp(App)

app.mount('#app')

// const sideBarSlot = document.querySelector('#real');
const sideBarSlot = document.querySelector('side-bar');
const sideBar = document.querySelector('#side-bar') as HTMLTemplateElement

sideBarSlot?.replaceWith(sideBar.content.cloneNode(true))