import { createApp } from '@rue/lumo';
// import {jsx} from '@rue/jsx-dev-runtime'
// console.log(jsx)
import { App } from './App';
import './style.css'

const app = createApp(App)

app.mount('#app')


// sideBarSlot?.replaceWith(sideBar.content.cloneNode(true))