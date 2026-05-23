import { component, template, For, If, listen, NodeRef, Portal, Style } from "@rue/luent"
import { Finitron, ion, watch } from "@rue/quarky"

//FIX: 
// [] conditional rendering with <o--portal>

export function Sidebar() {
   const items = ['a', 'b', 'c']
   const $contextMenu = NodeRef(IfContextMenu)

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

         {Style`
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
      </>
   )
}

function IfContextMenu() {
   const $container = NodeRef('div')

   const $menu = Finitron({
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
         <o--portal to='body'>
            <div>
               {If(($menu.is('opened')),
                  <div ref={$container} at:mounted={el => initMenu(el)} style={{ position: 'absolute', top: 0, left: 0 }}>
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
         </o--portal>
      </>
   )
}


function IfContextMenuB() {
   const $container = NodeRef('div')

   const $open = ion(false)

   function open() {
      $open.value = true
   }

   function close() {
      $open.value = false
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

   return component(
      {
         open
      },
      Portal('body',
         <dialog ref={container} open={$open} style={{ position: 'absolute', top: 0, left: 0, width: '10rem', height: '10rem' }}>
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
      )
   )
}

function IfContextMenuC() {
   const $container = NodeRef('div')

   const $open = ion(false)

   function open() {
      $open.value = true
   }

   function close() {
      $open.value = false
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
            <o--portal to='body'>
               <div ref={$container} at:mounted={initMenu} style={{ position: 'absolute', top: 0, left: 0 }}>
                  <p>
                     menu item 1
                  </p>
                  -
                  <p>
                     menu item 2
                  </p>
                  -
                  <p>
                     menu item 3
                  </p>
                  {/* {Thru($options, (option, index) => {
                  })} */}
               </div>
            </o--portal>
         )}
      </div>
   )
}






// Intuitive:
function IntuitivePopUpA() {
   const $open = ion(false)

   return component(
      <o--portal to='body'>
         {If($open,
            <div>

            </div>
         )}
      </o--portal>
   )
}


// Intuitive:
function IntuitivePopUpB() {
   const $open = ion(false)

   return component(
      <>
         {If($open,
            <o--portal to='body'>
               <div>

               </div>
            </o--portal>
         )}
      </>
   )
}


//What actually works
/* 
<o--portal to='body'>
   <div>
      {If($open,
         <div></div>
      )}
   </div>
</o--portal> 
*/