import { template, Style, Finitron, withTimeout } from "@rue/lumo";
import { Ion } from "@rue/quarky";
import "./style.css"

export function TrafficLight() {

   const trafficLight = Finitron({
      'on': { switch: () => 'off' },
      'off': { switch: () => 'on' },
      'x:broken': {},

      any: { break: () => 'x:broken' },
   });

   const state = Finitron({
      'fresh': { switch: () => 'sleep' },
      'awake': { switch: () => 'sleep' },
      'sleep': { switch: () => 'awake' },
   });

   const light = Finitron({
      'red': {
         'after:2000': () => 'yellow',
         change: () => 'yellow',
      },
      'yellow': {
         'after:2000': () => 'green',
         change: () => 'green',
      },
      'green': {
         'after:2000': () => 'red',
         change: () => 'red',
      },
   });

   trafficLight.activate(() => 'off').nest({
      'on': [state.init(() => 'fresh').nest({
         'fresh': [light.init(() => 'red')],
         'awake': [light.init((state) => state ?? 'red')],
      })],
   });

   trafficLight.atFinalState(() => {
      console.log("TRAFFIC LIGHT BROKED X__X");
   });


   function $LightOpacity(color: typeof light.state) {
      return Ion(() => {
         return trafficLight.is("on") && !state.is("sleep")
            ? trafficLight.is("x:broken")
               ? 0
               : light.is(color)
                  ? 1
                  : 0.3
            : 0.15;
      });
   }

   return template(
      <div style="place-items: center">
         <div class="traffic-light-container">
            <div
               class="light"
               style={{ backgroundColor: "red", opacity: $LightOpacity("red") }}
            ></div>
            <div
               class="light"
               style={{ backgroundColor: "gold", opacity: $LightOpacity("yellow") }}
            ></div>
            <div
               class="light"
               style={{ backgroundColor: "green", opacity: $LightOpacity("green") }}
            ></div>
         </div>
         <button
            on:click={(e) => trafficLight.apply("switch")}
            disabled={(trafficLight.is('x:broken'))}
         >
            {(trafficLight.is("on") ? "turn off" : "turn on")}
         </button>
         <button
            on:click={(e) => { if (state.is('sleep')) state.apply("switch"); light.apply("change") }}
            disabled={(trafficLight.is('x:broken') || !state.isActive())}
         >
            change
         </button>
         <button
            on:click={(e) => state.apply("switch")}
            disabled={(trafficLight.is('x:broken') || !state.isActive())}
         >
            {(state.is("sleep") ? "awaken" : "sleep")}
         </button>
         <button
            on:click={(e) => trafficLight.apply("break")}
            disabled={(trafficLight.is('x:broken') || !trafficLight.is('on'))}
         >
            break
         </button>
      </div>
   )
      .css`
         *,
         *::before,
         *::after {
           box-sizing: border-box;
         }
         
         button {
            margin: 10px 5px
         }
         
         .traffic-light-container {
            margin-top: 50px;
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
      `
}
