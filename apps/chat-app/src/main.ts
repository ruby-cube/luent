import { createRoot, createGroundContext } from "@rue/lumo";
import { FriendSite } from "./App";
import './assets/main.css'

// Chat App based on Net Ninja's chat app tutorial

createRoot(FriendSite, { groundContext: createGroundContext() }).mount('#app')