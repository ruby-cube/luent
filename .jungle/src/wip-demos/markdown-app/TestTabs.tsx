//@ts-nocheck
import { component, ContextKey, template, For, fromContext, FromTag, If, NodeRef } from "luent";
import { MarkdownApp } from "./markdown-app";
import { Ion, ionize, Ionized, observe, ion } from "@luent/quarky";

export function TabApp() {

   // const data = ionize({ id: 0, markdown: '# Sunny Day' })
   const $active = ion(true, {
      toggle() {
         $active.value = !$active()
      }
   })
   const $open = ion(true, {
      toggle() {
         $open.value = !$open()
      }
   })
   const $markdown = ion('# Something Special')

   return (

      <>
         <button on:click={$open.toggle}>open/close</button>
         <button on:click={$active.toggle}>show/hide</button>
         {/* {For(data, item => item.id, (item) => (
            <MarkdownApp mu:markdown={ions(item).$markdown}></MarkdownApp>
         ))} */}
         {
            If($open, 'create',
               If($active, 'preserve',
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

   close() {
      this.opened = false;
   }

   open() {
      this.opened = true;
   }
}

function asFiles(data: FileData[]) {
   return data.map(file => new File(file.id, file.markdown))
}

// TODO: What's the best way to sync with your database?


// A resource is where you transform the raw data into a rich domain model and set up syncing to the db

// const FILES = defineResource(async ({userId: number}) => {
//    const data = await dispatch({ get: DB_FILES })
//    // [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]

//    // TODO: how do you set up realtime updates from database and locally from another tab

//    const files = ionize(asFiles(data), {
//       add(file: File) {
//          files.push(file)
//          files.sortAlphabetically()
//       },
//       delete(index: number) {
//          files.splice(index, 1)
//       },
//       sortAlphabetically() {
//          // TODO:
//       }
//    })

//    observe(files, ({ collectionChanges }) => {
//       // TODO: update database
//    })

//    return files;
// })
const data = [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]

function LoadingApp() { //Stand-in until I fix mount

   // const files = dispatchGET(FILES, { $userId })


   const files = ionize(asFiles(data), {
      add(file: File) {
         files.push(file)
         files.sortAlphabetically()
      },
      delete(index: number) {
         files.splice(index, 1)
      },
      sortAlphabetically() {
         // TODO:
      }
   })


   return (

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


function App(input : {
   files: Ionized<File[]>
}) {

   const { files } = input;

   function addNewFile() {
      const file = files.add(new File())
      openFile(file);
   }

   function deleteFile(file: File) {
      const file = files[files.indexOf(file)]
      if (file.opened) tabsManager.closeFile(file)
      files.delete(index)
   }

   function openFile(file: File) {
      const index = $activeFile() ? openedFiles.indexOf($activeFile()) : 0
      openedFiles.insert(file, index)
      file.open()
      $activeFile.as(file);
   }

   function closeFile(file: File) {
      openedFiles.delete(openedFiles.indexOf(file))
      if ($activeFile() === file) {
         $activeFile.as(prevActiveFile)
      }
      file.close()
   }

   function focusFile(file: File) {
      $activeFile.as(openedFiles[index])
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

   let prevActiveFile: File | undefined;

   const $activeFile = ion(undefined as File | undefined, {
      as(file: File) {
         prevActiveFile = $activeFile.value;
         $activeFile = file;
      }
   })

   const MainView = Polymorph({
      home: <Home></Home>
      ,
      file: [(o: File) => o.id, (file: File) => (
         <MarkdownApp mu:markdown={file.$markdown}></MarkdownApp>
      )],
      default: 'home' // key | render function | undefined (default)
   })

   observe($activeFile, ({ current: file }) => {
      if (file) MainView.mount('file', file.id)
      else MainView.mount('home')
   })

   // observe(openedFiles, ({ collectionChange }) => {
   //    const { removedItems, newItems, movedItems } = collectionChange // TODO: implement with getters for lazy computation
   //    if (removedItems)
   //       for (const file of removedItems) {
   //          MainView.discard('file', file.id)
   //       }
   // })

   watchItems(openedFiles, (file, index) => {
      if (!file.opened) MainView.discard('file', file.id)
   })


   // MainView.mount('home')
   // MainView.mount('file', file)
   // MainView.unmount(); // will mount default if provided
   // MainView.discardAll()
   // MainView.discard('file', file)

   return (

      <>
         <Sidebar files={files} provide={[
            FILES_KIT({ addNewFile, deleteFile, openFile }),
         ]}></Sidebar>
         <main>
            <Tabs files={$openedFiles} provide={[
               TABS_KIT({ closeFile, focusFile })
            ]} />
            <MainView as={existingFile ? ['file', file] : 'home'}></MainView>
         </main>
      </>
   )
}

//NOTE: convention: kits are destructurable

type FileManager = {
   addNewFile(): void; //sidebar
   deleteFile(file: File): void; //sidebar
   openFile(file: File): void; //sidebar
}

type TabManager = {
   closeFile(file: File): void; //tabs
   focusFile(file: File): void; //tabs
}

const FILES_KIT = ContextKey<FileManager>('FILES_KIT')
const TABS_KIT = ContextKey<TabManager>('TABS_KIT')


// const OPEN_FILE = ContextKey(v<FileManager['openFile']>)
// const DELETE_FILE = ContextKey(v<FileManager['deleteFile']>)
// const ADD_NEW_FILE = ContextKey(v<FileManager['addNewFile']>)
// const CLOSE_FILE = ContextKey(v<TabManager['closeFile']>)
// const FOCUS_FILE = ContextKey(v<TabManager['focusFile']>)

export function List(input : {
		apple?: string,
		peach?: number,
		pear?: object,
		plum: Ion<string>
}>) {
		const { 
				$plum,
				$apple = fromContext($APPLE), 
				peach = fromContext(PEACH),
				_raw_: $
		} = input
		
		$.pear = $.pear ?? fromContext(PEAR)

		return;
}

const $APPLE = ContextKey<Ion<string>>('$APPLE')
const PEACH = ContextKey<string>('PEACH')
const PEAR = ContextKey<MaybeIon<string>>('PEAR')



function Sidebar(input : {
   files: Ionized<File[]> // TODO: Interesting... 'native' methods are easy to be made public, but methods declared via ionize() will be difficult to share the type...
}) {
   const { files } = input
   const { addFile } = fromContext(FILES_KIT);

   return (

      <div>
         {For($files, file => file.id, (file, $index) => (
            <SidebarFile file={file} index={$index}></SidebarFile>
         ))}
         <button on:click={e => addFile()}>+</button>
      </div>
   )
}

function SidebarFile(input : {
   file: Ionized<File>,
   index: Ion<number>
}) {
   const { $index, file } = input
   const $menu = NodeRef(IfContextMenu)

   const { openFile } = fromContext(FILES_KIT)

   return (

      <div on:click={e => openFile(file)} on:contextmenu={e=>$menu()?.open()}>
         <IfContextMenu on:click={reMenuClick} ref={$menu}></IfContextMenu>
         {file.$title}
      </div>
   )
}





// function Tabs(input : FromTag({
//    files: Ion<File[]>,
// })) {
//    const { $files } = input

//    return template(
//       <div>
//          {For($files, file => file.id, (file, $index) => (
//             <Tab file={file} index={$index}></Tab>
//          ))}
//       </div>
//    )
// }

// const CLOSE_FILE = ContextKey(v<(index: number) => void>)
// const FOCUS_FILE = ContextKey(v<(index: number) => void>)




function Tab(input : {
   index?: Ion<number>,
   file: Ionized<File>,
   tabManager?: TabManager,
}) {
   const { file, tabManager = fromContext(TABS_KIT), $index = ion('hi') } = input
   const { closeFile, focusFile } = tabManager

   return (

      <div style={{ backgroundColor: (file.active ? 'red' : 'gray') }}
         on:click={e => focusFile($index())}
      >
         {file.$title}
         <button on:click={e => closeFile($index())}>x</button>
      </div>
   )
}



// function Home() {
//    return template(
//       <div>

//       </div>
//    )
// }
