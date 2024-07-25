<script lang='ts'>
import { defineComponent, onMounted, ref } from 'vue';
import { useEventListener } from '../../thread/event-listeners';
import { onlyIf, stateRef } from '../State';
import { r$, nr } from "../../paravue/reactivity"

export const EPHEMRA_DEMO = 'EphemraDemo';
const onClick = useEventListener("click");

export default defineComponent({
    props: {},
    components: {},
    setup() {
        const outsideBtn = ref();
        const insideBtn = ref();
        const walkingBtn = ref();
        const runningBtn = ref();
        const sniffingBtn = ref();
        const rainyBtn = ref();
        const sunnyBtn = ref();
        const cloudyBtn = ref();

        const location = stateRef({
            id: "location",
            initial: "outside",
            states: {
                ['outside']: {
                    transition(state) {
                        onClick(nr(insideBtn), state.$willBecome("inside"));
                    }
                },
                ['inside']: {
                    transition(state) {
                        onClick(nr(outsideBtn), state.$willBecome("outside").if(() => true))
                    }
                }
            }
        })

        const outdoorActivity = stateRef({
            id: "outdoorActivity",
            precondition: [[location, "outside"]],
            initial: "walking",
            // ini(context)=> (context.happy ? "sniffing" : "walking"),
            states: {
                ['walking']: {
                    // canBecome: {
                    //     running: true,
                    //     sniffing: true,
                    //     // running: onlyIf(() => true)
                    // },
                    // isFinalState: true,
                    transition(state) {
                        onClick(nr(runningBtn), state.$willBecome("running").if(() => true))
                        onClick(nr(sniffingBtn), state.$willBecome("sniffing").if(() => true))
                    }
                },
                ['running']: {
                    canBecome: {
                        walking: true,
                        sniffing: true,
                        // running: onlyIf(() => true)
                    },
                    transition(state) {
                        onClick(nr(walkingBtn), state.$willBecome("walking").if(() => true))
                        onClick(nr(sniffingBtn), state.$willBecome("sniffing").if(() => true))
                    }
                },
                ['sniffing']: {
                    // canBecome: {
                    //     running: true,
                    //     walking: true,
                    //     // running: onlyIf(() => true)
                    // },
                    transition(state) {
                        onClick(nr(runningBtn), state.$willBecome("running").if(() => true))
                        onClick(nr(walkingBtn), state.$willBecome("walking").if(() => true))
                    }
                }
            }
        })

        function isHappy(dog: any) {
            return true;
        }

        const weather = stateRef({
            id: "weather",
            initial: "cloudy",
            states: {
                cloudy: {
                    canBecome: { any: true }
                },
                rainy: {
                    canBecome: { anyOther: true }
                },
                sunny: {
                    canBecome: {
                        sunny: true,
                        cloudy: true
                    },
                }
            }
        })

        const mood = stateRef({
            id: "mood",
            initial: "neutral",
            states: {
                neutral: {

                },
                sad: {

                },
                happy: {

                },
                excited: {

                }
            }
        })



        function makeCloudy() {
            weather.$mayBecome("cloudy");
        }

        function makeRainy() {
            weather.$mayBecome("rainy");
        }

        function makeSunny() {
            weather.$mayBecome("sunny");
        }

        function makeInside(){
            // location.$becomes("inside")
        }

        function makeOutside(){
            // location.$becomes("outside")
        }
        function makeWalking(){
            // outdoorActivity.$becomes("walking")
        }
        function makeRunning(){
            // outdoorActivity.$becomes("running")
        }
        function makeSniffing(){
            // outdoorActivity.$becomes("sniffing")
        }


        return {
            outsideBtn,
            insideBtn,
            walkingBtn,
            runningBtn,
            sniffingBtn,
            location,
            outdoorActivity,
            weather,
            rainyBtn,
            cloudyBtn,
            sunnyBtn,
            makeCloudy,
            makeRainy,
            makeSunny,
            makeInside,
            makeOutside,
            makeRunning,
            makeWalking,
            makeSniffing

        };
    },
});
</script>

<template>
    <p>{{ r$(location) }}</p>
    <p>{{ r$(outdoorActivity) }}</p>
    <div>
        <button @click="makeOutside" ref="outsideBtn">outside</button>
        <button @click="makeInside" ref="insideBtn">inside</button>
    </div>
    <div>
        <button @click="makeWalking" ref="walkingBtn">walking</button>
        <button @click="makeRunning" ref="runningBtn">running</button>
        <button @click="makeSniffing" ref="sniffingBtn">sniffing</button>
    </div>
    <!-- <p>{{ r$(weather) }}</p>
        <div>
            <button @click="makeRainy" ref="walkingBtn">rainy</button>
            <button @click="makeCloudy" ref="runningBtn">cloudy</button>
            <button @click="makeSunny" ref="sniffingBtn">sunny</button>
        </div> -->
</template>

<style lang='scss'>
button {
    padding: 10px;
    background-color: aliceblue;
    margin: 10px;
    border-radius: 5px;
}
</style>