import { createApp } from '@rue/lumo';
// import {jsx} from '@rue/jsx-dev-runtime'
// console.log(jsx)
// import { App } from './App';
import './style.css'
import { TestCounter } from './TestCounter';
import { TextBox } from './TestBox';
import { App } from './App';
import { TestConditional } from './TestConditional';
import { List } from './TestReactiveModel';



const app = createApp(List)

app.mount('#app')


// sideBarSlot?.replaceWith(sideBar.content.cloneNode(true))