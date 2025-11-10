import { createRoot, createGlobalCommons } from "@rue/lumo";
import { FriendSite } from "./App";
import './assets/main.css'


createRoot(FriendSite, { globalCommons: createGlobalCommons() }).mount('#app')