//@ts-nocheck
import { ion, watch } from "@rue/quarky";
import { ref } from "@rue/lumo"

function TrafficLight() {
   const $trafficLight = ion('red' as 'red' | 'green' | 'yellow', {
      change() {
         switch ($trafficLight.state) {
            case 'red':
               $trafficLight.state = 'green'
               break;

            case 'green':
               $trafficLight.state = 'yellow'
               break;

            case 'yellow':
               $trafficLight.state = 'red'
               break;

            default:
               break;
         }
      }
   })
}



const $trafficLight = finite.ion({
   [INITIAL]: 'red',
   red: {
      enter: timedChange,
      onChange: 'green'
   },
   green: {
      enter: timedChange,
      onChange: 'yellow'
   },
   yellow: {
      enter: timedChange,
      onChange: 'red'
   }
})

function timedChange(light) {
   setTimeout(() => {
      light.change()
   }, 100)
}

// State paths from root
const YELLOW = 'on.#color:yellow'

// states should be kabob case
const trafficLight = ionicMachine({
   $state: {
      [INITIAL]: 'off',
      'off': {
         turnOn: () => 'on',
         turnOnWithYellow: () => YELLOW // to non-child, non-adjacent state (use full path)
      },
      'on': {
         nested: {
            $color: {
               [INITIAL]: 'red',
               'red': {
                  onEnter: timedChange,
                  change: () => 'green',
               },
               'green': {
                  onEnter: timedChange,
                  change: () => 'yellow',
               },
               'yellow': {
                  onEnter: timedChange,
                  change: () => 'red',
                  forceRetire: () => 'retired'
               }
            },
            $sound: {
               [INITIAL]: 'red',
               'red': {
                  onEnter: timedChange,
                  change: () => 'green',
               },
               'green': {
                  onEnter: timedChange,
                  change: () => 'yellow',
               },
               'yellow': {
                  onEnter: timedChange,
                  change: () => 'red',
                  forceRetire: () => 'retired'
               }
            }
         },
         retire: () => 'retired',
         turnOff: () => 'off',
         forceGreen: () => '.color.green' // to child state
      },
      'retired': {
         [TERMINAL]: true
      },
      onTerminated: () => { }
   }
}, {
   // methods
})



class RootMachine {
   modules: StatefulModule[]

   moduleLookup: Map<`#${string}`, StatefulModule>

   // current state
   leafStates: Set<State>

   transitionTasks: Map<string, Set<() => void>>

   performTransition(key: string, transition: () => string | void) {
      const tasks = this.transitionTasks.get(key)
      if (tasks) {
         for (const task of tasks) {
            task()
         }
      }
      return transition()
   }

   transitionOut(state: State) {
      this.leafStates.delete(state)
   }

   transitionIn(state: State) {
      this.leafStates.add(state)
   }

   someTransition() {
      const toTransitionOut = []
      const toTransitionIn = []
      for (const state of this.leafStates) {
         const module = state.module;
         const transitions = state.transitions
         if (key in transitions) {
            const newStateID = this.performTransition(key, state[key]) // performTransition takes care of any transition hooks
            // assuming that all transitions are aggregated in the state (or prototype chain is in effect) and no manual inheritance chain traversal is necessary
            if (newStateID) {
               let newState: State;
               if (newStateID in module.finiteStates) {
                  newState = module.finiteStates[newStateID]
               }
               else if (newState.startsWith('.')) { // relative path
                  newState = getChildState(newState, state)
               }
               else if (newState.startsWith('#')) {

               }
               else {
                  const statePath = toStatePath(newStateID)
                  //TODO: absolute path
               }
               toTransitionOut.push(state)
               toTransitionIn.push(newState)
            }
         }
      }

      for (const state of toTransitionOut) {
         this.transitionOut(state)
         state.onExit?.()
      }

      for (const state of toTransitionIn) {
         const { onEnter, onTimeout } = state
         this.transitionIn(state)
         onEnter?.()
         if (onTimeout) setTimeout(onTimeout[1], onTimeout[0]);
         if (state[TERMINAL]) {
            state.module.onTerminated?.()
         }
      }

   }
}

class StatefulModule {
   id: string

   root: RootMachine
   parent?: StatefulModule

   initialState: string

   // current state
   state: string

   finiteStates: { [key: string]: State }

   onTerminated?: () => void
}

type StatefulModules = { [key: `$${string}`]: StatefulModule }

class State {
   id: string
   module: StatefulModule

   nested?: StatefulModules

   onEnter?: () => void | string
   onExit?: () => void | string
   onTimeout?: [number, () => string]

   transitions: { [key: string]: () => string | false | undefined | null }

   terminal?: true
}


class TrafficLight {
   currentState: 'off'
   currentLeafStates = new Set();

   off = {
      turnOn: () => 'on',
      turnOnWithYellow: () => YELLOW // to non-child, non-adjacent state (use full path)
   }

   on = {
      nested: {
         id: '#color',
         currentState: 'red',
         [INITIAL]: 'red',
         'red': {
            onEnter: timedChange,
            change: () => 'green',
         },
         'green': {
            onEnter: timedChange,
            change: () => 'yellow',
         },
         'yellow': {
            onEnter: timedChange,
            change: () => 'red',
            forceRetire: () => 'retired'
         }
      },
      retire: () => 'retired',
      turnOff: () => 'off',
      forceGreen: () => '.color.green' // to child state
   }

   change() {

   }

   turnOn() {

   }

   turnOff() {
      const currentState = this[this.currentState];

      // search for method
      if (key in currentState) {
         const newState = currentState.turnOff();
      }
      else if (currentState.facets.length) {
         const facets = currentState.facets;
         for (const facet of facets) {

         }
      }
   }
}

type AbsoluteStatePath = string;

class StateMachine {
   is(state: AbsoluteStatePath) {
      // should track   ... how fine-grained to we track though?

   }
}

// NOTE: Modules should be readonly ions that can be watched   trafficLight.$color  trafficLight.$state 


trafficLight.is('on') // reactive
trafficLight.is(RED)

trafficLight.on('change', () => {

})

trafficLight.can('change')

trafficLight.$state
trafficLight.$color

trafficLight.change()


$color.is('red')
$color.on('change', () => {

})

$color.change()



const $trafficLight = ion.finite('red', {
   'red': {
      change: () => 'green',
   },
   'green': {
      change: () => 'yellow',
   },
   'yellow': {
      change: () => 'red',
   },
   'dead': {}
}, {
   onTerminated() {

   },
   onEnter() {
      setTimeout(() => {
          $trafficLight.change()
      }, 100)
   },
   destroy: () => 'dead'
})





function ionicMachine(config: any) {
   const currentStates = {} // states is plural in case 

   if (INITIAL in config) {
      const stateDef = currentStates[STATE] = config[config[INITIAL]]
      if (hasNestedState(stateDef)) {

      }
   }
   else {
      // parallel states
      for (const key in config) {

      }
   }


   config[config[INITIAL]]

}

function manageNestedState() {

}


const TOO_MANY_ATTEMPTS = 'too-many-attempts'

const auth = ion.finite({
   ID: 'auth',
   [INITIAL]: 'unauthenticated',
   unauthenticated: {
      [RE(LOG_IN)]: 'loggingIn'
   },
   loggingIn: {
      [INITIAL]: 'processing',
      processing: {

      },
      error: {
         [RE(RETRY)]: '#auth.loggingIn',
         [RE(TOO_MANY_ATTEMPTS)]: 'blocked'
      },
      blocked: {
         [RE(ERROR)]: '#auth.unauthenticated' // Targeting parent
      },
      [RE(SUCCESS)]: 'authenticated',
      [RE(FAILURE)]: 'loggingIn.error',
   },
   authenticated: {
      [RE(LOG_OUT)]: 'unauthenticated'
   }
});

auth.process(TOO_MANY_ATTEMPTS)


const PAUSED = 'ready.$track.paused'
const PLAYING = 'ready.$track.playing'
const ENDED = 'ready.$track.ended'
const SOUND_ON = 'ready.$sound.on'
const SOUND_MUTED = 'ready.$sound.muted'

class VideoPlayer {

   private $state = finiteStates({
      [INITIAL]: 'loading',
      loading: {
         init() { return 'ready' },
         errorOut() { return 'failure' }
      },
      ready: {
         $track: {
            [INITIAL]: 'paused',
            paused: {
               play() { return 'playing' }
            },
            playing: {
               pause() { return 'paused' },
               end() { return 'ended' },
            },
            ended: {
               play() { return 'playing' }
            }
         },
         $sound: {
            [INITIAL]: 'on',
            on: {
               toggle() { return 'muted' }
            },
            muted: {
               toggle() { return 'on' }
            }
         }
      },
      failure: {
         [TERMINAL]: true
      }
   }, {
      play() {
         $state()
      }
   })

   duration = 0
   elapsed = 0
   volume = 10

   get init() {
      return this.$state.init
   }

   get errorOut() {
      return this.$state.errorOut
   }

   get end() {
      return this.$state.end
   }

   get play() {
      return this.$state.play
   }

   updateTime(currentTime: number) {
      if (!this.isPlaying) return;
      this.elapsed = currentTime;
   }

   get isReady() {
      return this.$state.is('ready');
   }

   get isPlaying() {
      return this.$state.is(PLAYING)
   }
}

function App() {
   const $video = ref('video')
   const videoPlayer = ionize(new VideoPlayer())

   videoPlayer.on('play', () => $video()?.play())
   videoPlayer.on('pause', () => $video()?.pause())

   return component(
      <>
         <video
            ref={$video}
            on:canplay={e => videoPlayer.init()}
            on:timeupdate={e => videoPlayer.updateTime($video()!.currentTime)}
            on:ended={e => videoPlayer.end()}
            on:error={e => videoPlayer.errorOut()}
         >
            <source src="/fox.mp4" type="video/mp4" />
         </video>
         {If($=videoPlayer.isReady,
            <>
               {If($=videoPlayer.isPlaying,
                  <button>Pause</button>
               )}
               {Else(
                  <button
                     on:click={e => videoPlayer.play()}
                  >Play</button>
               )}
            </>
         )}
      </>
   )
}

const INITIAL = Symbol('initial-finite-state')
const TERMINAL = Symbol('final-finite-state')

type FiniteStatesConfig<T extends FiniteStates = FiniteStates> = {
   [INITIAL]: keyof T
} & T

type FiniteStates = {
   [key: string]: FiniteState
}

type FiniteState = {
   [TERMINAL]?: true,
   [key: string]: FiniteStateTransition
} & ({} | FiniteStatesConfig)

type FiniteStateTransition = () => string

function finite(states: FiniteStatesConfig) {

   return rein(ion(states[INITIAL], new Proxy({
      get() {

      }
   })))
}

// State machines
// Setup
// State
// Context
// Input
// Output
// Events and transitions
// Eventless (always) transitions
// Delayed (after) transitions
// Actions
// Guards
// Initial states
// Finite states
// Parent states
// Parallel states
// Final states
// History states
// Persistence
// Tags
// Event emitter

const TrafficLight = defineFiniteStates({
   [INITIAL]: 'red',
   red: {
      enter: timedChange,
      onChange: 'green'
   },
   green: {
      enter: timedChange,
      onChange: 'yellow'
   },
   yellow: {
      enter: timedChange,
      onChange: 'red'
   }
})


const CoffeeMachine = defineState({
   initial: 'preparation',
   states: {
      preparation: {
         initial: 'weighing',
         states: {
            weighing: {
               'on:weighed': 'grinding',
            },
            grinding: {
               'on:ground': 'ready',
            },
            ready: 'final',
         },
         onDone: 'brewing',
      },
      brewing: {
         // ...
      },
   },
});


const playerMachine = createMachine({
   id: 'player',
   aspects: { // parallel states
      track: {
         initial: 'paused',
         states: {
            paused: {
               on: { PLAY: 'playing' },
            },
            playing: {
               on: { STOP: 'paused' },
            },
         },
      },
      volume: {
         initial: 'normal',
         states: {
            normal: {
               on: { MUTE: 'muted' },
            },
            muted: {
               on: { UNMUTE: 'normal' },
            },
         },
      },
   },
});



const VideoPlayer = defineState({

})

import { assertEvent, assign, fromPromise, setup } from "xstate";
import { wait } from "../../lib/wait";
import { component } from "@rue/lumo";
import { AnyObject } from "@rue/types";

interface UserData {
   username: string;
}

const USER_DATA_STORAGE_KEY = "user";

export type SignOnErrorCode = "unknown error" | "invalid credentials" | "duplication";

/**
 * Make an HTTP request to your API or third-party service handling authentication
 * to get the data of the user.
 *
 * Usually I design my API to expose a `/me` route, which returns user's data when
 * an authenticated cookie is attached to the request.
 * Otherwise, return `null` or throw an error.
 */
const fetchUserData = fromPromise(async () => {
   await wait(1_000);

   const rawUserData = localStorage.getItem(USER_DATA_STORAGE_KEY);
   if (rawUserData === null) {
      // Can also `throw new Error('...')`
      return null;
   }

   const userData = JSON.parse(rawUserData) as UserData;

   return userData;
});

/**
 * Make an HTTP request to your API or third-party service handling authentication.
 *
 * Delete the user's authentication cookie or clear the token from the localStorage.
 */
const signOut = fromPromise(async () => {
   await wait(1_000);

   localStorage.removeItem(USER_DATA_STORAGE_KEY);
});

/**
 * Make an HTTP request to your API or third-party service handling authentication.
 *
 * Verify if the credentials submitted by the user are valid or not and respond with user's data in case they are.
 * Usually, I handle form validation outside of my machine, by using React Hook Form on my React components
 * and sending the `sign-in` event when the form's values have been successfully validated.
 */
const signIn = fromPromise<
   | { success: true; userData: UserData }
   | { success: false; error: SignOnErrorCode },
   { username: string; password: string }
>(async ({ input }) => {
   await wait(1_000);

   if (input.password.length < 2) {
      return {
         success: false,
         error: "invalid credentials",
      };
   }

   const userData: UserData = {
      username: input.username,
   };

   localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(userData));

   return {
      success: true,
      userData,
   };
});

/**
 * Make an HTTP request to your API or third-party service handling authentication.
 */
const signUp = fromPromise<
   | { success: true; userData: UserData }
   | { success: false; error: SignOnErrorCode },
   { username: string; password: string }
>(async ({ input }) => {
   await wait(1_000);

   /**
    * Simulate that the username is already taken by another user.
    */
   if (input.username.toLowerCase() === "xstate") {
      return {
         success: false,
         error: "duplication",
      };
   }

   const userData: UserData = {
      username: input.username,
   };

   localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(userData));

   return {
      success: true,
      userData,
   };
});

export const authenticationMachine = setup({
   types: {
      events: {} as
         | { type: "sign-out" }
         | { type: "sign-in"; username: string; password: string }
         | { type: "sign-up"; username: string; password: string }
         | { type: "switching sign-on page" },
      context: {} as {
         userData: UserData | null;
         authenticationErrorToast: SignOnErrorCode | undefined;
      },
      tags: "Submitting sign-on form",
   },
   actors: {
      "Fetch user data": fetchUserData,
      "Sign out": signOut,
      "Sign in": signIn,
      "Sign up": signUp,
   },
   actions: {
      "Clear user data in context": assign({
         userData: null,
      }),
      "Clear authentication error toast in context": assign({
         authenticationErrorToast: undefined,
      }),
   },
}).createMachine({
   id: "Authentication",
   context: {
      userData: null,
      authenticationErrorToast: undefined,
   },
   initial: "Checking if user is initially authenticated",
   states: {
      "Checking if user is initially authenticated": {
         invoke: {
            src: "Fetch user data",
            onDone: [
               {
                  guard: ({ event }) => event.output !== null,
                  target: "Authenticated",
                  actions: assign({
                     userData: ({ event }) => event.output,
                  }),
               },
               {
                  target: "Not authenticated",
               },
            ],
            onError: {
               target: "Not authenticated",
            },
         },
      },
      Authenticated: {
         initial: "Idle",
         states: {
            Idle: {
               description:
                  "The state in which an authenticated user will be most of the time. This is where you handle things a user can only do authenticated.",
               on: {
                  "sign-out": {
                     target: "Signing out",
                  },
               },
            },
            "Signing out": {
               invoke: {
                  src: "Sign out",
                  onDone: {
                     target: "Signed out",
                     actions: "Clear user data in context",
                  },
                  onError: {
                     target: "Idle",
                     /**
                      * You may display a toast to indicate that we couldn't sign out the user.
                      */
                     actions: []
                  }
               },
            },
            "Signed out": {
               type: "final",
            },
         },
         onDone: {
            target: "Not authenticated",
         },
      },
      "Not authenticated": {
         entry: "Clear authentication error toast in context",
         initial: "Idle",
         states: {
            Idle: {
               on: {
                  "sign-in": {
                     target: "Signing in",
                  },
                  "sign-up": {
                     target: "Signing up",
                  },
                  "switching sign-on page": {
                     actions: "Clear authentication error toast in context",
                  },
               },
            },
            "Signing in": {
               tags: "Submitting sign-on form",
               invoke: {
                  src: "Sign in",
                  input: ({ event }) => {
                     assertEvent(event, "sign-in");

                     return {
                        username: event.username,
                        password: event.password,
                     };
                  },
                  onDone: [
                     {
                        guard: ({ event }) => event.output.success === true,
                        target: "Successfully signed on",
                        actions: assign({
                           userData: ({ event }) => {
                              if (event.output.success !== true) {
                                 throw new Error(
                                    "Expect to reach this action when output.success equals true"
                                 );
                              }

                              return event.output.userData;
                           },
                        }),
                     },
                     {
                        target: "Idle",
                        actions: assign({
                           authenticationErrorToast: ({ event }) => {
                              if (event.output.success !== false) {
                                 throw new Error(
                                    "Expect to reach this action when output.success equals false"
                                 );
                              }

                              return event.output.error;
                           },
                        }),
                     },
                  ],
                  onError: {
                     target: "Idle",
                     actions: assign({
                        authenticationErrorToast: "unknown error",
                     }),
                  },
               },
            },
            "Signing up": {
               tags: "Submitting sign-on form",
               invoke: {
                  src: "Sign up",
                  input: ({ event }) => {
                     assertEvent(event, "sign-up");

                     return {
                        username: event.username,
                        password: event.password,
                     };
                  },
                  onDone: [
                     {
                        guard: ({ event }) => event.output.success === true,
                        target: "Successfully signed on",
                        actions: assign({
                           userData: ({ event }) => {
                              if (event.output.success !== true) {
                                 throw new Error(
                                    "Expect to reach this action when output.success equals true"
                                 );
                              }

                              return event.output.userData;
                           },
                        }),
                     },
                     {
                        target: "Idle",
                        actions: assign({
                           authenticationErrorToast: ({ event }) => {
                              if (event.output.success !== false) {
                                 throw new Error(
                                    "Expect to reach this action when output.success equals false"
                                 );
                              }

                              return event.output.error;
                           },
                        }),
                     },
                  ],
                  onError: {
                     target: "Idle",
                     actions: assign({
                        authenticationErrorToast: "unknown error",
                     }),
                  },
               },
            },
            "Successfully signed on": {
               type: "final",
            },
         },
         onDone: {
            target: "Authenticated",
         },
      },
   },
});