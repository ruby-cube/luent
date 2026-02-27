import { template, Else, FromTag, If, Style, css } from "@rue/lumo";
import { SignupForm } from "./SignupForm";
import { ion } from "@rue/quarky";
import { LoginForm } from "./LoginForm";
import './welcome-view.css'

export function WelcomeView(input: FromTag<{
   initialLoad: boolean
}>) {
   const { initialLoad } = input
   const $initialLoad = Ion(initialLoad)

   return template(
      <>
         <div class="welcome container">
            {If($initialLoad,
               <>
                  <h2>Sign up</h2>
                  <SignupForm></SignupForm>
                  <p>Already registered? <span on:click={e => $initialLoad.value = false}>Log in</span> instead</p>
               </>
            )}
            {Else(
               <>
                  <h2>Log in</h2>
                  <LoginForm></LoginForm>
                  <p>No account yet? <span on:click={e => $initialLoad.value = true}>Sign up</span> instead</p>
               </>
            )}
         </div>
      </>
   )
      .style(css`
         .welcome {
           text-align: center;
           padding: 20px 0;
         }
         .welcome form {
           width: 300px;
           margin: 20px auto;
         }
         .welcome label {
           display: block;
           margin: 20px 0 10px;
         }
         .welcome input {
           width: 100%;
           padding: 10px;
           border-radius: 20px;
           border: 1px solid #eee;
           outline: none;
           color: #999;
           margin: 10px auto;
         }
         .welcome span{
           font-weight: bold;
           text-decoration: underline;
           cursor: pointer;
         }
         .welcome button {
           margin: 20px auto;
         }
      `)
}