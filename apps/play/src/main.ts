import { createApp } from '@rue/lumo';
// import {jsx} from '@rue/jsx-dev-runtime'
// console.log(jsx)
// import { App } from './App';
import './style.css'
import { TestCounter } from './TestCounter';
import { TextBox } from './TestBox';
const app = createApp(TextBox)

app.mount('#app')


// sideBarSlot?.replaceWith(sideBar.content.cloneNode(true))