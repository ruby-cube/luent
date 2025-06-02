import { component, For, If, listen, ref } from "@rue/lumo"
import { finiton, ion, watch } from "@rue/quarky"

//FIX: 
// [] conditional rendering with <$--portal>

export function Sidebar() {
   const items = ['a', 'b', 'c']
   const $contextMenu = ref(IfContextMenu)

   return component(
      <>
         <ul class='sidebar'>
            {For(items, (item) => (
               <>
                  <li class='sidebar-item' on:contextmenu={e => (e.preventDefault(), console.log($contextMenu()), $contextMenu()!.open())}>{item}</li>
               </>
            ))}
            <IfContextMenuC ref={$contextMenu}></IfContextMenuC>
         </ul>

         <$--style>
            {`
            .sidebar-item {
               background-color: beige;
               border: solid 3px white;
               list-style-type: none;
               width: 10rem
            }
            
            .sidebar-item:hover {
               background-color: pink;
            }

            .sidebar {
               padding: 0;
               background-color: gray;
               width: 10rem;
               height: 100vh;
            }
            `}
         </$--style>
      </>
   )
}

function IfContextMenu() {
   const $container = ref('div')

   const $menu = finiton({
      'opened': {
         close: () => 'closed'
      },
      'closed': {
         open: () => 'opened'
      }
   })

   $menu.activate(() => 'closed')

   function initMenu(menuNode: HTMLElement) {
      let menuClicked = false;

      listen(menuNode, 'click', e => {
         menuClicked = true
         $menu.apply('close')
      }, { once: true })

      listen(document, 'click', e => {
         return menuClicked || $menu.apply('close')
      }, { once: true })
   }

   return component({
      open() {
         $menu.apply('open')
      }
   },
      <>
         <$--portal to='body'>
            <div>
               {If(($menu.is('opened')),
                  <div ref={$container} post:mount={el => initMenu(el)} style={{ position: 'absolute', top: 0, left: 0 }}>
                     menu item 1
                     -
                     menu item 2
                     -
                     menu item 3
                     {/* {Thru($options, (option, index) => {
                  })} */}
                  </div>
               )}
            </div>
         </$--portal>
      </>
   )
}


function IfContextMenuB() {
   const $container = ref('div')

   const $open = ion(false)

   function open() {
      $open.state = true
   }

   function close() {
      $open.state = false
   }

   watch($open, ({ current: open }) => {
      if (!open) return
      let menuClicked = false;
      listen(document, 'click', e => menuClicked || close(), { once: true })
      listen($container()!, 'click', e => {
         menuClicked = true
         console.log('menu clicked')
         close()
      }, { once: true })
   })

   return component({
      open
   },
      <$--portal to='body'>
         <dialog ref={$container} open={$open} style={{ position: 'absolute', top: 0, left: 0, width: '10rem', height: '10rem' }}>
            <div >
               menu item 1
               -
               menu item 2
               -
               menu item 3
               {/* {Thru($options, (option, index) => {
                  })} */}
            </div>
         </dialog>
      </$--portal>
   )
}

function IfContextMenuC() {
   const $container = ref('div')

   const $open = ion(false)

   function open() {
      $open.state = true
   }

   function close() {
      $open.state = false
   }

   function initMenu(menuNode: HTMLElement) {
      let menuClicked = false;

      listen(menuNode, 'click', e => {
         menuClicked = true
         console.log('menu clicked')
         close()
      }, { once: true })

      listen(document, 'click', e => {
         return menuClicked || close()
      }, { once: true })
   }

   return component({
      open
   },
      <div>
         {If($open,
            <$--portal to='body'>
               <div ref={$container} post:mount={initMenu} style={{ position: 'absolute', top: 0, left: 0 }}>
                  menu item 1
                  -
                  menu item 2
                  -
                  menu item 3
                  {/* {Thru($options, (option, index) => {
                  })} */}
               </div>
            </$--portal>
         )}
      </div>
   )
}






// Intuitive:
function IntuitivePopUpA() {
   const $open = ion(false)

   return component(
      <$--portal to='body'>
         {If($open,
            <div>

            </div>
         )}
      </$--portal>
   )
}


// Intuitive:
function IntuitivePopUpB() {
   const $open = ion(false)

   return component(
      <>
         {If($open,
            <$--portal to='body'>
               <div>

               </div>
            </$--portal>
         )}
      </>
   )
}


//What actually works
/* 
<$--portal to='body'>
   <div>
      {If($open,
         <div></div>
      )}
   </div>
</$--portal> 
*/