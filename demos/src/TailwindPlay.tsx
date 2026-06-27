import { component, mount, css, template, Style } from "@rue/luent";
import "./index.css"
import "./TailwindPlay-card.css"
import ".overrides.css" // transpiler

function Grandparent() {
    return component(
        <Parent class='bg-blue-600'></Parent>
        // <Parent class='override0 bg-blue-600'></Parent> // transpiler
    )
}

function Parent() {

    return component(
        <Child class='bg-amber-900'></Child>
        // <Child class='override1 bg-amber-900'></Child> // transpiler
    )
}

function Child() {
    return component(
        <>
            <div class='bg-amber-400'>hi</div>
            {Style(css`
               @reference "./index.css";

               .override0 .override1 .bg-amber-600 {
                  @apply bg-blue-600;
               }

               .override1 .bg-amber-900 {
                  @apply bg-amber-900;
               }
            `)}
        </>
    )
}


function TailwindPlay() {
    const HEIGHT = 610

    return component(
        <div></div>
        // <div class='bg-amber-400 override0 override1 bg-amber-900 bg-blue-600'>child</div>
        // <div class='card lessons'>
        //     <div class='card-content h-full px-0 animate-in'>
        //         His house is in the village though
        //     </div>
        // </div>
    )
}

if (__STYLE__)
    mount(TailwindPlay, '#root')


// <Card className="h-[610px] gap-2 flex flex-col border-solid border rounded-lg">
//   <CardContent className="h-full px-0">
//     <div className="flex flex-1 flex-col h-full">
//       <div className="flex flex-col flex-1 gap-2 h-full">
//         {children}
//       </div>
//     </div>
//   </CardContent>
// </Card>