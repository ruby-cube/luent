import { component, For, If } from "@rue/lumo"
import { ion, ionicTask } from "@rue/quarky"
import { onPostlude, postludePhase } from "../../../../packages/lumo/src/render/render-cycle"

type Commit = {
   commit: {
      message: string,
      author: {
         html_url: string
         name: string,
         date: string
      }
   }
   html_url: string,
   sha: string,
   author: {
      html_url: string
      name: string,
      date: string
   }
}

export function View() {
   const API_URL = `https://api.github.com/repos/vuejs/core/commits?per_page=3&sha=`
   const branches = ['main', 'minor']

   const $currentBranch = ion(branches[0])
   const $commits = ion([] as Commit[])

   ionicTask(w => {
      onPostlude(async () => {
         // this effect will run immediately and then
         // re-run whenever currentBranch.value changes
         const response = await fetch(`${API_URL}${w($currentBranch)}`)
         $commits.state = await response.json()
      })
   })

   function truncate(v: string) {
      const newline = v.indexOf('\n')
      return newline > 0 ? v.slice(0, newline) : v
   }

   function formatDate(v: string) {
      return v.replace(/T|Z/g, ' ')
   }

   return component(
      <>
         <h1>Latest Vue Core Commits</h1>
         {For(branches, branch => (
            <>
               <input type="radio" name="branch" id={branch}
                  value={branch}
                  mu:checked={$currentBranch}
                  // on:input={e => $currentBranch.state = branch}
               />
               <label for={branch}>{branch}</label>
            </>
         ))}
         <p>vuejs/core@{$currentBranch}</p>
         {If($commits().length > 0,
            <ul>
               {For($commits, m => m.sha, ({ html_url, sha, author, commit }) => (
                  <li>
                     <a href={html_url} target="_blank" class="commit">{sha.slice(0, 7)}</a>
                     - <span class="message">{truncate(commit.message)}</span><br />
                     by <span class="author">
                        <a href={author.html_url} target="_blank">{commit.author.name}</a>
                     </span> at < span class="date" > {formatDate(commit.author.date)}</span >
                  </li >
               ))}
            </ul >
         )}
      </>
   )
}

