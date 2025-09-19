import { component, Style } from "@rue/lumo";
import {
   FiniteIon,
   ion,
   ionic,
} from "@rue/quarky";

export function TrafficLight() {

   const $power = FiniteIon({
      on: {
         switch: () => "off",
      },
      off: {
         switch: () => "on",
      },
      "x:broken": {},

      'any': {
         break: () => "x:broken",
      },
   });

   const $state = FiniteIon({
      on: { switch: () => "sleep" },
      awake: { switch: () => "sleep" },
      sleep: { switch: () => "awake" },
   });

   const $trafficLight = FiniteIon({
      red: {
         "after:2000": () => "yellow",
         change: () => "yellow",
      },
      yellow: {
         "after:2000": () => "green",
         change: () => "green",
      },
      green: {
         "after:2000": () => "red",
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

   function $LightOpacity(color: ReturnType<typeof $trafficLight>) {
      return ion(() =>{
         return $power.is("on") && !$state.is("sleep")
            ? $power.is("x:broken")
               ? 0
               : $trafficLight.is(color)
                  ? 1
                  : 0.3
            : 0.15;
      });
   }

   function $BtnOpacity(isActive: () => boolean = () => !$power.is("x:broken")) {
      return ion(() =>{
         return $power.is("x:broken") ? 0.5 : isActive() ? 1 : 0.5;
      });
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
            on:click={(e) => $power.apply("switch")}
            style={{ opacity: $BtnOpacity() }}
         >
            {($power.is("on") ? "turn off" : "turn on")}
         </button>
         <button
            on:click={(e) => { if ($state.is('sleep')) $state.apply("switch"); $trafficLight.apply("change") }}
            style={{ opacity: $BtnOpacity($state.isActive) }}
         >
            change
         </button>
         <button
            on:click={(e) => $state.apply("switch")}
            style={{ opacity: $BtnOpacity($state.isActive) }}
         >
            {($state.is("sleep") ? "awaken" : "sleep")}
         </button>
         <button
            on:click={(e) => $power.apply("break")}
            style={{ opacity: $BtnOpacity(() => $power.is("on")) }}
         >
            break
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
