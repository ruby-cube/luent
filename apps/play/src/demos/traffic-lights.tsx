import { component } from "@rue/lumo";
import { ANY_STATE, finiton, ion, withTimeout as transitionAfter } from "@rue/quarky";

// click before timeout
//  - clear timeout



export function TrafficLight() {

   const $power = finiton('off', {
      'on': { switch: () => 'off' },
      'off': { switch: () => 'on' }
   })

   const $trafficLight = finiton('red', {
      'red': {
         "on:enter": () => console.log('@@% entering red'),
         'after:enter': transitionAfter(2000,
            () => 'yellow'
         ),
         change: () => 'yellow'
      },
      'yellow': {
         "on:exit": () => console.log('@@% exiting yellow'),
         'after:enter': transitionAfter(2000,
            () => 'green'
         ),
         change: () => 'green'
      },
      'green': {
         'after:enter': transitionAfter(2000,
            () => 'red'
         ),
         change: () => 'red'
      },
      'x:broken': {},
      [ANY_STATE]: {
         break: () => 'x:broken'
      }
   })

   $power.activate()

   $trafficLight.onFinalState(() => {
      console.log('@@% BROKED')
   })

   $power.nest({
      'on': [$trafficLight],
   })

   function getOpacity(color: string) {
      return function $opacity() {
         return $power.is('on') ? $trafficLight.is('x:broken') ? 0 : $trafficLight.is(color) ? 1 : .3 : .15
      }
   }

   return component(
      <>
         <div class='traffic-light-container'>
            {/* <div class='light' style={{ backgroundColor: 'red', opacity: $=$power.is('on') ? $trafficLight.is('x:broken') ? 0 : $trafficLight.is('red') ? 1 : .3 : .15 }}></div>
            <div class='light' style={{ backgroundColor: 'gold', opacity: $=$power.is('on') ? $trafficLight.is('x:broken') ? 0 : $trafficLight.is('yellow') ? 1 : .3 : .15 }}></div>
            <div class='light' style={{ backgroundColor: 'green', opacity: $=$power.is('on') ? $trafficLight.is('x:broken') ? 0 : $trafficLight.is('green') ? 1 : .3 : .15 }}></div> */}
            <div class='light' style={{ backgroundColor: 'red', opacity: getOpacity('red') }}></div>
            <div class='light' style={{ backgroundColor: 'gold', opacity: getOpacity('yellow') }}></div>
            <div class='light' style={{ backgroundColor: 'green', opacity: getOpacity('green') }}></div>
         </div>
         <button on:click={e => $trafficLight.apply('change')}>change</button>
         <button on:click={e => $trafficLight.apply('break')} style={{ opacity: $ = $trafficLight.is('x:broken') ? .5 : 1 }}>break</button>
         <button on:click={e => $power.apply('switch')}>{$ = $power.is('on') ? 'turn off' : 'turn on'}</button>
         <$--style>
            {`
*,
*::before,
*::after {
  box-sizing: border-box;
}

         .traffic-light-container {
           background-color: black; 
           width: 100px; 
           height: 300px;
           padding: 10px;
         }
         
         .light {
           width: 80px; 
           height: 80px;
           border-radius: 50%;
           margin-bottom: 10px;
         }
            `}
         </$--style>
      </>
   )
}