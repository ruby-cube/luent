import { component, Else, For, If, ref } from "@rue/lumo"
import { ion, ionicTask } from "@rue/quarky"
import { onPostlude, postlude_phase, render_phase } from "../../../../packages/lumo/src/render/render-cycle"

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


   ionicTask(async (w, initial) => {
      if (!initial) $commits.state = []
      const response = await fetch(`${API_URL}${w($currentBranch)}`)
      $commits.state = await response.json()
   })

   ionicTask(async w => {
      await postlude_phase()
      console.log('postlude logging', w($currentBranch))
   })


   // @click: e => $currentBranch.state = branch <--- begins render cycle
   // ..prelude: fetch new commits; set $commits.state = []
   // ..render: update $currentBranch text, radio buttons; clear $commits
   // ..postlude: --
   // ----
   // @fetch-response: convert response to json
   // @json-response: set $commits <-- begins render cycle
   // ..prelude: --
   // ..render: render $commits
   // ..postlude: --

   // If the network is fast enough, this could happen in one render cycle:
   //
   // @click: e => $currentBranch.state = branch <--- begins render cycle
   // ..prelude: fetch new commits
   // @fetch-response: convert response to json
   // @json-response: set $commits <-- begins render cycle
   // ..render: update $currentBranch text, radio buttons; render $commits
   // ..postlude: --


   function truncate(v: string) {
      const newline = v.indexOf('\n')
      return newline > 0 ? v.slice(0, newline) : v
   }

   function formatDate(v: string) {
      return v.replace(/T|Z/g, ' ')
   }

   return component(
      <div style='width: 500px'>
         <h1>Latest Vue Core Commits</h1>

         {For(branches, branch => (
            <>
               <input type="radio" name="branch"
                  id={branch}
                  value={branch}
                  mu:checked={$currentBranch}
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
      </div>
   )
}

