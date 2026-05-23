//@ts-nocheck
import { component, template } from '@rue/luent'
// function LoadingApp() {
//    const $data = fromCloud(MARKDOWN_FILES) // Data | undefined

//    return template(
//       <>
//          {Resolve(suspense =>
//             <App data={$data} {...suspense}></App>
//          )}
//          {Meanwhile(
//             <>
//                <Sidebar></Sidebar>
//                <main></main>
//             </>
//          )}
//          {Catch(error =>
//             <div>oh no</div>
//          )}
//       </>
//    )
// }

function Album(input : FromTag<{
   resolve: ResolveSuspense
}>) {
   const { resolve } = input

   const $album = fromCloud(ALBUM, {
      suspense: resolve,
      catch(err) {
         $album.value = 'default'
      }
   })
   const $albumB = fromCloud(ALBUMB, { suspense: resolve }) // will resolve in parallel
   const [$albumA, $albumB, $albumC]
      = fromCloud([ALBUM_A, ALBUM_B, ALBUM_C]) // resolve in sequence (dependent fetches)

   return component((album = $album()) =>
      <div>{album.$title}</div>
   )
}

// Lazy loading

const Z = LazyModule(() => import('./MarkdownPreview.js'));

const ZZ = LazyModule(() => import('./MarkdownPreview.js'), {
   MarkdownPreview: component,
});

export default function MarkdownEditor() {
   const $showPreview = ion(false);
   const $markdown = ion('Hello, **world**!');

   return (
      <>
         <textarea value={$markdown} onChange={e => $markdown.value = e.target.value} />
         <label>
            <input type="checkbox" checked={$showPreview} onChange={e => $showPreview.value = e.target.checked} />
            Show preview
         </label>
         <hr />
         {If($showPreview, [
            Resolve(suspense =>
               <>
                  <h2>Preview</h2>
                  <Z.MarkdownPreview markdown={$markdown} {...suspense} />
                  <button on:click={e => Z.doSomething()}>click</button>
               </>
            ),
            Meanwhile(
               <Loading />
            ),
            Catch(err =>
               <ErrorComp msg={err.msg} />
            )
         ])}
      </>
   );
}




const MarkdownPreview = Lazy(() => import('./MarkdownPreview.js'));

export default function MarkdownEditor() {
   const $showPreview = ion(false);
   const $markdown = ion('Hello, **world**!');

   return (
      <>
         <textarea value={$markdown} onChange={e => $markdown.value = e.target.value} />
         <label>
            <input type="checkbox" checked={$showPreview} onChange={e => $showPreview.value = e.target.checked} />
            Show preview
         </label>
         <hr />
         {If($showPreview,
            Await(suspense => <>
               <h2>Preview</h2>
               <MarkdownPreview markdown={$markdown} {...suspense} />
            </>),
            Meanwhile(
               <Loading />
            )
         )}
      </>
   );
}


// {Await()} {Meanwhile()} {Catch()} 
// useAwait()
// Awaited()


export default function MarkdownEditor() {
   const $showPreview = ion(false);
   const $markdown = ion('Hello, **world**!');

   const Await = useAwait({
      Suspense:
         <Loading />,
      timeout: 500,
      Catch: error =>
         <div>oh no</div>
   })

   return (
      <>
         <textarea value={$markdown} onChange={e => $markdown.value = e.target.value} />
         <label>
            <input type="checkbox" checked={$showPreview} onChange={e => $showPreview.value = e.target.checked} />
            Show preview
         </label>
         <hr />
         {If($showPreview, Await(<>
            <h2>Preview</h2>
            <MarkdownPreview markdown={$markdown} />
         </>))}
      </>
   );
}

// {Catch(error =>
//    <div>oh no</div>
// )}



function LoadingApp() {
   const $data = fromCloud(MARKDOWN_FILES) // how to deal with latency?

   // const Await = useAwait({ // output function
   //    loading:
   //       <Loading />
   //    ,
   //    timeout: 500
   //    ,
   //    catch: error =>
   //       <div>oh no</div>
   // })

   // const $App = Awaited({  // output component
   //    await: suspense => (
   //       <App data={$data} {...suspense}></App>
   //    ),
   //    meanwhile: () => (
   //       <Loading />
   //    ),
   //    timeout: 500,
   //    catch: error => (
   //       <div>oh no</div>
   //    )
   // })

   // const Try = useTry({
   //    catch: error =>
   //       <div>oh no</div>
   // })

   const $App = Tentative({
      try: () => (
         <App data={$data}></App>
      ),
      catch: error => (
         <div>oh no</div>
      )
   })

   return component(
      <>
         <h1>Hello World</h1>
         {Await($data, suspense =>
            <App data={$data} {...suspense}></App>
         )}
      </>
   )
}
function LoadingApp() {
   const $data = fromCloud(MARKDOWN_FILES) // how to deal with latency?

   return component(
      <>
         <h1>Hello World</h1>
         {Await(suspense =>
            <App data={$data} {...suspense}></App>
         )}
         {Meanwhile(
            <Loading />
         )}
         {Catch(error =>
            <div>oh no</div>
         )}
      </>
   )
}



const MARKDOWN_FILES = defineDBSync(() => {
   const $data = dispatch({ get: '...' }, [])

   const $files = ion(() =>ionize($data().map(file => new File(file.id, file.markdown)),
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
      // TODO: how to rollback with failed action(s)
   })

   return $files;
})


function App(input : FromTag()) {
   const $files = fromCloud(MARKDOWN_FILES, [])

   const $openedFiles = ion(() =>$files().filter((file) => file.opened))

   const $MainView = Polymorph({
      'home':
         <Home></Home>
      ,
      'file': [(o: File) => o.id, file =>
         <MarkdownApp mu:markdown={o$(file).$markdown}></MarkdownApp>
      ]
   })


   const $activeTab = $MainView.morphable(existingFile ? ['file', file] : 'home')

   // $main.as('home')
   // $main.discardOthers() // will mount default or nothing (undefined) if current view is discarded
   // $main.discardAll() // will mount default or nothing (undefined) if current view is discarded
   // $main.discard('file', file)
   // $main() // outputs current view as a tuple

   function openFile(file: File) {
      file.open()
      $main.as('file', file)
   }

   function closeFile(file: File) {
      file.close()
      $main.discard('file', file)
      fallbackFocus()
   }

   function fallbackFocus() {
      const prevFile = $prevActiveFile()
      if (prevFile && prevFile.opened) {
         focusFile(prevFile)
      }
      else
         $main.as('default')
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
         {Await($files, () =>
            <>
               <Sidebar files={$files} provide={[
                  CAN_OPEN_FILE(index => openFile(files[index])),
                  CAN_ADD_FILE(addFile),
                  CAN_DELETE_FILE(deleteFile)
               ]}></Sidebar>
               <main>
                  <Tabs files={$openedFiles} provide={[
                     CAN_CLOSE_FILE(index => closeFile($openedFiles()[index])),
                     CAN_FOCUS_FILE(index => focusFile($openedFiles()[index]))
                  ]} />
                  <MainView as={$main}></MainView>
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