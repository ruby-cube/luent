import { CommonsKey, component, For, fromCommons, fromTag, v } from "@rue/lumo";
import { inert, ion, Inert, ionize, Ion, Ionized } from "@rue/quarky";
import { robots } from "./robots";

//TODO:
// [] ion() as Ion<Inert<>>
// [] ion.ionize() in ionized models proxy ion access
// [] type fromTag<T>() ---> input
//    [] mu: and mu?:
// [] type input ---> jsx attributes
//    [] Inert vs non-inert
// [] fromCommons.ion()
//    [] .ion('mu')(FROG)
// [] mu() typehelper

// concerns: 
// - choosing between ion vs ionize and changing in the future
// - choosing between non-reactive vs ion and changing in the future
// - passing in name, id, email, vs robot object

interface Robot {
   id: number;
   name: string;
   username: string;
   email: string;
}

class Frog { name: string = 'kermit' }

// type Muon<T> = ()=>T

// function muon<T, M>(value: T, methods: M): Muon<T> & M{

// }

// const $$greeting = muon('hi', {change(){}})

export function RoboFriendsApp() {
   const robots = ionize([] as Robot[])

   return component(
      <>
         <h1>RoboFriends</h1>
         <RoboList
            robots={robots}
         ></RoboList>
      </>
   )
}


// fromTag -> input {}
// input -> attributes

//QUESTION: Who should author the inert map for input? The component or the parent of the component?
// I think technically, it needs to be the component, in order for the input to be typed correctly, however, does it make sense?
//QUESTION: What happens if you have one component asking for an inert frog and another asking for an ionized frog...
// They would need to be two different frogs. You may have to sync them if they represent the same frog.


export function RoboList(input = fromTag<{
   robots: Ionized<Robot[]>, // $robots: Ion<Ionized<Robot[]>> | robots: Ionized<Robot[]> ---> robots={MaybeIon<Ionized<Robot[]>>}  // Robot[] OK! , but Inert<Robot>[] | Ion<Robot[]> ERROR!
}>()) {
   const { robots } = input; //TODO: type input such that $robots is defined


   return component(
      <div class='robo-list'>
         {For(robots!, m => m.id, robot => (
            <RoboCard
               id={robot.id}
               name={robot.$name!}
               email={robot.$email!}
            ></RoboCard>
         ))}
      </div>
   )
}

// const CAN_CLOSE_DIALOG = CommonsOpKey<>()
// const ON_CLOSE_DIALOG = CommonsEventKey<EVENT>()
// const LIST = CommonsKey<>()

export function RoboCard(input = fromTag<{
   id: number;
   name: Ion<string>;
   email: Ion<string>;
}>()) {
   const {
      id,
      $name,
      $email,
   } = input

   // const list = fromCommons(LIST, '?') ?? []
   // const $frog = fromCommons.asIon('mu?')(FROG)
   // const items = fromCommons(ITEMS)
   // const closeDialog = fromCommons(CAN_CLOSE_DIALOG)
   // const emitClick = fromCommons(ON_CLOSE_BUTTON_CLICK)


   // const $swamp = fromCommons.asIon()

   // function updateEmail() {
   //    if (mu($email)) mu($email).state = new Email()
   // }

   // optional and default
   // mutability
   // 

   return component(
      <>
         <div class='robot-card grow'>
            <img alt='robot' src={`https:robohash.org/${id}?size=200x200`} />
            <div>
               <h2>{$name}</h2>
               <p>{$email}</p>
            </div>
         </div>
      </>
   )
}