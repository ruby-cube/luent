import { createApp, createGlobalCommons } from "@rue/lumo";
import { FriendlyChatApp } from "./App";
import './assets/main.css'


createApp(FriendlyChatApp, { globalCommons: createGlobalCommons() }).mount('#app')