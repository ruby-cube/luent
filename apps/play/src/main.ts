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
import { MainSite } from './AwaitTest';
import { ConditionalFlaskTest } from './ConditionalFlaskTest';
import { Root } from './TreeTest';
import { NestedPend } from './NestedPend';



const app = createApp(NestedPend)

if (__DEV__) configureFlask({
    warnNoCleanup: true
})

app.mount('#app')

window.addEventListener('beforeunload', () => {
    console.log("unloading...")
})