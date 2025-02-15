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
   // opened: boolean = false
   // active: boolean = false

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

   // close() {
   //    this.active = false;
   //    this.opened = false;
   // }

   // open() {
   //    this.active = true;
   //    this.opened = true;
   // }
}

function asFiles(data: FileData[]) {
   return data.map(file => new File(file.id, file.markdown))
}

//TODO: What's the best way to sync with your database?


// A resource is where you transform the raw data into a rich domain model and set up syncing to the db

// const FILES = defineResource(async ({userId: number}) => {
//    const data = await dispatch({ get: DB_FILES })
//    // [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]

//    //TODO: how do you set up realtime updates from database and locally from another tab

//    const files = ionize(asFiles(data), {
//       add(file: File) {
//          files.push(file)
//          files.sortAlphabetically()
//       },
//       delete(index: number) {
//          files.splice(index, 1)
//       },
//       sortAlphabetically() {
//          //TODO:
//       }
//    })

//    watch(files, ({ collectionChanges }) => {
//       // TODO: update database
//    })

//    return files;
// })
const data = [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]

function LoadingApp() { //Stand in until I fix createApp

   // const files = fromResources(FILES, { $userId })


   const files = ionize(asFiles(data), {
      add(file: File) {
         files.push(file)
         files.sortAlphabetically()
      },
      delete(index: number) {
         files.splice(index, 1)
      },
      sortAlphabetically() {
         //TODO:
      }
   })


   return component(
      // Await
      <App files={files}></App>
   )
}

// type Files = ReturnType<typeof asIonizedFiles>

// function asIonizedFiles(data: FileData[]){

//    return ionize(data.map(file => new File(file.id, file.markdown)), {

//       remove(index: number) {
//          files.splice(index, 1);
//       },

//       add(file: File, index) {
//          files.splice(index, 0, file)
//       }
//    }) // Assumes no realtime updates from db. For realtime updates, use derived ion
// }

// class Files extends Array<File> {

//    constructor(data: FileData[]){
//       super(...data.map(file=>new File(file.id, file.markdown)))
//    }

//    remove(index: number) {
//       files.splice(index, 1);
//    }

//    add(file: File, index) {
//       files.splice(index, 0, file)
//    }
// }


function App(input = fromTag({
   files: Ionized<File[]>
})) {

   const { files } = input;

   function addNewFile() {
      const file = files.add(new File())
      openFile_makeActive(file)
   }

   function deleteFile(index: number) {
      const file = files[index]
      if (isOpen(file)) closeFile(file)
      files.delete(index)
   }

   const openedFiles = ionize([] as File[], {
      delete(index: number) {
         if (index < 0 || index >= openedFiles.length) return false;
         openedFiles.splice(index, 1);
         return true;
      },
      insert(file: File, index) {
         openedFiles.splice(index, 0, file)
      }
   })

   function openFile_makeActive(file: File) {
      const index = $activeFile() ? openedFiles.indexOf($activeFile()) : 0
      openedFiles.insert(file, index)
      $activeFile.as(file)
   }

   function isOpen(file: File) {
      return openedFiles.indexOf(file) !== -1
   }

   function closeOpenedFile(index: number) {
      openedFiles.delete(index)
      if ($activeFile() === file) {
         $activeFile.as(prevActiveFile)
      }
   }

   function focusOpenedFile(index: number) {
      $activeFile.as($openedFiles()[index])
   }


   let prevActiveFile: File | undefined;

   const $activeFile = ion(undefined as File | undefined, {
      as(file: File) {
         prevActiveFile = $activeFile.state;
         $activeFile = file;
      }
   })

   const MainView = Polymorph({
      home: <Home></Home>
      ,
      file: [(o: File) => o.id, file =>
         <MarkdownApp mu:markdown={o$(file).$markdown}></MarkdownApp>
      ],
      default: 'home' // key | render function | undefined (default)
   })

   watch($activeFile, ({ state: file }) => {
      if (!isOpen(prevActiveFile))
         MainView.discard('file', prevActiveFile.id)
      if (file) MainView.mount('file', file.id)
      else MainView.mount('home')

   })

   watch(openedFiles, ({ collectionChange }) => {
      const { removedItems, newItems, movedItems } = collectionChange //TODO: implement with getters for lazy computation
      if (removedItems)
         for (const file of removedItems) {
            MainView.discard('file', file.id)
         }
   })

   // MainView.mount('home')
   // MainView.mount('file', file)
   // MainView.unmount(); // will mount default if provided
   // MainView.discardAll()
   // MainView.discard('file', file)

   return component(
      <>
         <Sidebar files={files} provide={[
            m(OPENFILE, index => openFile(files[index])),
            m(ADDFILE, addFile),
            m(DELETEFILE, deleteFile)
         ]}></Sidebar>
         <main>
            <Tabs files={$openedFiles} provide={[
               m(CLOSEFILE, closeOpenedFile),
               m(FOCUSFILE, focusOpenedFile)
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
      <div style={[{ backgroundColor: $=file.active ? 'red' : 'gray' }, inherited.style]}
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

