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
            <MarkdownApp mu:markdown={ions(item).$markdown}></MarkdownApp>
         ))} */}
         {
            If($open, 'create',
               If($active, 'mount',
                  // <MarkdownApp></MarkdownApp>
                  <MarkdownApp mu:markdown={$markdown}></MarkdownApp>
                  // <MarkdownApp mu:markdown={ions(data).$markdown}></MarkdownApp>
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


function LoadingApp() { //Stand in until I fix createApp
   const data = [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]

   const files = asFiles(data)

   return component(
      <App files={files}></App>
   )
}

function asFiles(data: FileData){
   return ionize(data.map(file => new File(file.id, file.markdown)), {
      remove(index: number) {
         files.splice(index, 1);
      },
      add(file: File, index) {
         files.splice(index, 0, file)
      }
   }) // Assumes no realtime updates from db. For realtime updates, use derived ion
}


function App(input = fromTag({
   files: Ionized<File[] & {
      remove(index: number): void;
      add(file: File, index: any): void;
   }>
})) {

   const $openedFiles = ion(() => $files().filter((file) => file.opened))

   const MainView = Polymorph({
      home: <Home></Home>
      ,
      file: [(o: File) => o.id, file =>
         <MarkdownApp mu:markdown={o$(file).$markdown}></MarkdownApp>
      ],
      default: 'home' // key | render function | undefined (default)
   })

   // MainView.mount('home')
   // MainView.mount('file', file)
   // MainView.unmount(); // will mount default if provided
   // MainView.discardAll()
   // MainView.discard('file', file)

   function openFile(file: File) {
      file.open()
      MainView.mount('file', file)
   }

   function closeFile(file: File) {
      file.close()
      MainView.discard('file', file, {
         fallback: fallbackFocus()
      })
   }

   function fallbackFocus() {
      const prevFile = $prevActiveFile()
      if (prevFile && prevFile.opened) {
         focusFile(prevFile)
      }
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

