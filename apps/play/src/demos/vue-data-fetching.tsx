import { component, Else, For, If} from "@rue/lumo"
import { ion, queueIonicTask } from "@rue/quarky"
import { $postlude} from "../../../../packages/quarky/src/reactivity/RenderCycle"
import { $_run_with_, $_snap_context } from "@rue/flask"

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


   // const context = $_snap_context()

   queueIonicTask(async (initial) => {
      if (!initial) $commits.value = []
      const response = await fetch(`${API_URL}${$currentBranch()}`)
      $commits.value = await response.json()
   })

   // queueIonicTask(async () => {
   //    await $postlude()
   //    console.log('postlude logging', $currentBranch())
   // })


   // @click: e => $currentBranch.value = branch <--- begins render cycle
   // ..prelude: fetch new commits; set $commits.value = []
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
   // @click: e => $currentBranch.value = branch <--- begins render cycle
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

         {If(($commits().length > 0),
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
         <o--link href="src/demos/vue-data-fetching.css" rel="stylesheet"/>
      </div>
   )
}

