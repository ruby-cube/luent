import { component, FromTag, RenderSlot } from "@rue/lumo";
import './navbar.css'
import { User } from "../commons/keys";
import { logOut } from "../database/firebase";

export function Navbar(input: FromTag<{
   user: User,
   'can:navigateHome': () => void,
   Slot?: RenderSlot
}>) {
   const { user, navigateHome, Slot } = input

   return component(
      <>
         <nav>
            <button on:click={navigateHome}>Home</button>
            <div>
               <p>Hey there {user.name}</p>
               <p class='detail'>Currently logged in as {user.email}</p>
            </div>
            {Slot?.()}
            <button on:click={logOut}>Log out</button>
         </nav>
      </>
   )
}


