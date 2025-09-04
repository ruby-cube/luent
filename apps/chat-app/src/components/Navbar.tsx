import { component, FromTag } from "@rue/lumo";
import './navbar.css'
import { User } from "../commons/keys";
import { Ion } from "@rue/quarky";
import { logOut } from "../database/firebase";

export function Navbar(input: FromTag<{
   user: Ion<User>
}>) {
   const { $user } = input

   return component(
      <nav>
         <div>
            <p>Hey there {($user().name)}</p>
            <p class='detail'>Currently logged in as {($user().email)}</p>
         </div>
         <button on:click={logOut}>Log out</button>
      </nav>
   )
}