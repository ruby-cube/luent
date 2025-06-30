import { component, Style } from "@rue/lumo";
import {
   ANY_STATE,
   finiton,
   ion,
   withTimeout as transitionAfter,
} from "@rue/quarky";

// click before timeout
//  - clear timeout

export function TrafficLight() {
   const $power = finiton({
      on: {
         switch: () => "off",
      },
      off: {
         switch: () => "on",
      },
      "x:broken": {},

      [ANY_STATE]: {
         break: () => "x:broken",
      },
   });

   const $state = finiton({
      on: { switch: () => "sleep" },
      sleep: { switch: () => "awake" },
      awake: { switch: () => "sleep" },
   });

   const $trafficLight = finiton({
      red: {
         "on:enter": () => console.log("@@% entering red"),
         "after:enter": transitionAfter(2000, () => "yellow"),
         change: () => "yellow",
      },
      yellow: {
         "on:exit": () => console.log("@@% exiting yellow"),
         "after:enter": transitionAfter(2000, () => "green"),
         change: () => "green",
      },
      green: {
         "after:enter": transitionAfter(2000, () => "red"),
         change: () => "red",
      },
   });

   $trafficLight.onFinalState(() => {
      console.log("@@% BROKED");
   });

   $power
      .activate(() => "off")
      .nest({
         on: [
            $state
               .init(() => "on")
               .nest({
                  on: [$trafficLight.init(() => "red")],
                  awake: [$trafficLight.init((state) => state ?? "red")],
               }),
         ],
      });

   function $LightOpacity(color: string) {
      return function $o() {
         return $power.is("on") && !$state.is("sleep")
            ? $power.is("x:broken")
               ? 0
               : $trafficLight.is(color)
                  ? 1
                  : 0.3
            : 0.15;
      };
   }

   function $BtnOpacity(isActive: () => boolean = () => !$power.is("x:broken")) {
      return function $o() {
         return $power.is("x:broken") ? 0.5 : isActive() ? 1 : 0.5;
      };
   }

   return component(
      <>
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
            on:click={(e) => $trafficLight.apply("change")}
            style={{ opacity: $BtnOpacity($trafficLight.isActive) }}
         >
            change
         </button>
         <button
            on:click={(e) => $power.apply("break")}
            style={{ opacity: $BtnOpacity(() => $power.is("on")) }}
         >
            break
         </button>
         <button
            on:click={(e) => $power.apply("switch")}
            style={{ opacity: $BtnOpacity() }}
         >
            {$power.is("on") ? "turn off" : "turn on"}
         </button>
         <button
            on:click={(e) => $state.apply("switch")}
            style={{ opacity: $BtnOpacity($state.isActive) }}
         >
            {$state.is("sleep") ? "awaken" : "sleep"}
         </button>
         
         {Style`
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
      </>
   );
}
