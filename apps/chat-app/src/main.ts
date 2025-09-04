import { createApp, createGlobalCommons } from "@rue/lumo";
import { ChatApp } from "./App";
import './assets/main.css'


createApp(ChatApp, { globalCommons: createGlobalCommons() }).mount('#app')