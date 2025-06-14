
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


function App(input = fromTag()) {
   const $files = fromCloud(MARKDOWN_FILES, [])

   const $openedFiles = ion(() => $files().filter((file) => file.opened))

   const MainView = Polymorph({
      default:
         <Home></Home>
      ,
      file: [(o: File) => o.id, file =>
         <MarkdownApp mu:markdown={o$(file).$markdown}></MarkdownApp>
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