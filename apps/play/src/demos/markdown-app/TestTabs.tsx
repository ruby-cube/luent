//@ts-nocheck
import { component, CommonsKey, For, fromCommons, fromTag, If, Ion, Ionized, v } from "@rue/lumo";
import { MarkdownApp } from "./markdown-app";
import { AtomicIon, ion, ionize, o$ } from "@rue/quarky";
import { MorphicNode } from "../../../../../packages/lumo/src/morphic/MorphicNode";

export function TabApp() {

   // const data = ionize({ id: 0, markdown: '# Sunny Day' })
   const $active = ion(true, {
      toggle() {
         $active.state = !$active()
      }
   })
   const $open = ion(true, {
      toggle() {
         $open.state = !$open()
      }
   })
   const $markdown = ion('# Something Special')

   return component(
      <>
         <button on:click={$open.toggle}>open</button>
         <button on:click={$active.toggle}>toggle</button>
         {/* {For(data, item => item.id, (item) => (
            <MarkdownApp nu:markdown={ions(item).$markdown}></MarkdownApp>
         ))} */}
         {
            If($open, 'create',
               If($active, 'mount',
                  <MarkdownApp nu:markdown={$markdown}></MarkdownApp>
                  // <MarkdownApp nu:markdown={ions(data).$markdown}></MarkdownApp>
               )
            )
         }
      </>
   )
}


type FileData = {
   id: number,
   markdown: string,
}

class File {
   opened: boolean = false
   active: boolean = false

   constructor(
      public id: number = genId(),
      public markdown: string = ''
   ) { }

   get title() {
      return firstLineOf(this.markdown)
   }

   get preview() {
      return secondLineOf(this.markdown)
   }

   close() {
      this.active = false;
      this.opened = false;
   }

   open() {
      this.active = true;
      this.opened = true;
   }
}

// function toFiles(data: FileData[]) {
//    return data.map(file => new File(file.id, file.markdown))
// }
//TODO: What's the best way to sync with your database?

function fromDB(MARKDOWN_FILES) {
   return [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]
}

function LoadingApp() {
   const $data = dispatch({ get: MARKDOWN_FILES }) // how to deal with latency?

   return component(
      <>
         {Await($data,
            <App data={$data}></App>
         )}
         {Meanwhile(
            <>
               <Sidebar></Sidebar>
               <main></main>
            </>
         )}
         {Catch(error =>
            <div>oh no</div>
         )}
      </>
   )
}

function Album() {
   const $album = resolveSuspense(fromCloud(ALBUM)) 
   const $albumB = resolveSuspense(fromCloud(ALBUMB)) // will resolve in parallel
   const $albumDescription = resolveSuspense(fromCloud(ALBUM, )) //TODO: how to resolve in sequence (dependent fetches)


   return component((album = $album()) =>
      <div>{album.$title}</div>
   )
}



const MARKDOWN_FILES = defineDBSync(() => {
   const $data = dispatch({ get: '...' }, [])

   const $files = ion(() => ionize($data().map(file => new File(file.id, file.markdown)),
      {
         remove(index: number) {
            files.splice(index, 1);
         },
         add(file: File, index) {
            files.splice(index, 0, file)
         }
      }))

   watch($files, ({ mutations }) => {
      dispatch({ post: '...', })
      //TODO: how to rollback with failed action(s)
   })

   return $files;
})



function App(input = fromTag({
   // data: v<FileData[]>
})) {
   const $files = fromCloud(MARKDOWN_FILES, [])

   const $openedFiles = ion(() => $files().filter((file) => file.opened))

   const MainView = Polymorph({
      default:
         <Home></Home>
      ,
      file: [(o: File) => o.id, file =>
         <MarkdownApp nu:markdown={o$(file).$markdown}></MarkdownApp>
      ]
   })

   // MainView.mount('home')
   // MainView.mount('file', file)
   // MainView.unmount(); // will mount default if provided
   // MainView.discardAll().mount('home');
   // MainView.discard('file', file).mount('home')

   function openFile(file: File) {
      file.open()
      MainView.mount('file', file)
   }

   function closeFile(file: File) {
      file.close()
      MainView.discard('file', file)
      fallbackFocus()
   }

   function fallbackFocus() {
      const prevFile = $prevActiveFile()
      if (prevFile && prevFile.opened) {
         focusFile(prevFile)
      }
      else
         MainView.mount('default')
   }

   function focusFile(file: File) {
      file.active = true;
      MainView.mount('file', file)
   }

   function addFile(index: number) {
      const file = files.add(new File(), index)
      openFile(file)
   }

   function deleteFile(index: number) {
      const file = files[index];
      closeFile(file)
      files.remove(index)
   }

   return component(
      <>
         {Await($files, (files) =>
            <>
               <Sidebar files={files} provide={[
                  m(OPENFILE, index => openFile(files[index])),
                  m(ADDFILE, addFile),
                  m(DELETEFILE, deleteFile)
               ]}></Sidebar>
               <main>
                  <Tabs files={$openedFiles} provide={[
                     m(CLOSEFILE, index => closeFile($openedFiles()[index])),
                     m(FOCUSFILE, index => focusFile($openedFiles()[index]))
                  ]} />
                  <MainView as={existingFile ? ['file', file] : 'home'}></MainView>
               </main>
            </>
         )}
         {Meanwhile(
            <>
               <Sidebar></Sidebar>
               <main></main>
            </>
         )}
         {Catch(error =>
            <div>oh no</div>
         )}
      </>
   )
}

const OPENFILE = CommonsKey(v<(index: number) => void>, 'm')
const DELETEFILE = CommonsKey(v<(index: number) => void>, 'm')
const ADDFILE = CommonsKey(v<(index: number) => void>, 'm')

function Sidebar(input = fromTag({
   files: Ionized<File[]> //TODO: Interesting... 'native' methods are easy to be made public, but methods declared via ionize() will be difficult to share the type...
})) {
   const { files } = input

   return component(
      <div>
         {For($files, file => file.id, (file, $index) => (
            <File file={file} index={$index}></File>
         ))}
      </div>
   )
}




function Tabs(input = fromTag({
   files: Ion<File[]>,
})) {
   const { $files } = input

   return component(
      <div>
         {For($files, file => file.id, (file, $index) => (
            <Tab file={file} index={$index}></Tab>
         ))}
      </div>
   )
}

const CLOSEFILE = CommonsKey(v<(index: number) => void>, 'm')
const FOCUSFILE = CommonsKey(v<(index: number) => void>, 'm')

function Tab(input = fromTag({
   index: Ion<number>('??')('hi'),
   file: Ionized<File>,
   closeFile: v('??')(fromCommons(CLOSEFILE)),
   focusFile: v('??')(fromCommons(FOCUSFILE)),
   inherited: ['style', 'class']
})) {
   const { file, closeFile, focusFile, $index, inherited } = input

   return component(
      <div style={[{ backgroundColor: $ = file.active ? 'red' : 'gray' }, inherited.style]}
         on:click={e => focusFile($index())}
      >
         {o$(file).$title}
         <button on:click={e => closeFile($index())}>x</button>
      </div>
   )
}



function Home() {
   return component(
      <div>

      </div>
   )
}

