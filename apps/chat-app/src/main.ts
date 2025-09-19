import { createApp, createGlobalCommons } from "@rue/lumo";
import { FriendSite } from "./App";
import './assets/main.css'


createApp(FriendSite, { globalCommons: createGlobalCommons() }).mount('#app')