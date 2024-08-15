import { createApp, useEventListener } from '@rue/lumo';
// import {jsx} from '@rue/jsx-dev-runtime'
// console.log(jsx)
// import { App } from './App';
import './style.css'
import { TestCounter } from './TestCounter';
import { TestBox } from './TestBox';
import { App } from './App';
import { TestConditional } from './TestConditional';
import { List } from './TestReactiveModel';
import { configureFlask } from '../../../packages/flask/initFlask';



const app = createApp(App)

if (__DEV__) configureFlask({
    warnNoCleanup: true
})

app.mount('#app')

window.addEventListener('beforeunload', () => {
    console.log("unloading...")
})