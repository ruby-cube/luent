import { createApp } from '@rue/lumo';
// import {jsx} from '@rue/jsx-dev-runtime'
// console.log(jsx)
import { App } from './App';
import './style.css'

const app = createApp(App)

app.mount('#app')

// const sideBarSlot = document.querySelector('#real');
const sideBarSlot = document.querySelector('side-bar');
const sideBar = document.querySelector('#side-bar') as HTMLTemplateElement

sideBarSlot?.replaceWith(sideBar.content.cloneNode(true))