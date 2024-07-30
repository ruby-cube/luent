// import { createApp } from '@rue/lumo';
// import {jsx} from '@rue/jsx-dev-runtime'
// console.log(jsx)
// import { App } from './App';
import './style.css'

// const app = createApp(App)

// app.mount('#app')


// sideBarSlot?.replaceWith(sideBar.content.cloneNode(true))
const div = document.createElement('div')
div.innerText = "hello world"
const body = document.querySelector('body')
body?.append(div);

const button = document.createElement('button');
button.innerText = "click"















let on = false;
button.addEventListener("click", ()=>{
    on = !on;
    if (on){
        frame();
    }
})

body?.append(button)


let count = 0

function frame(){
    requestAnimationFrame(()=>{
        count++
        console.log("frame")
        if (count % 2){
            div.style.backgroundColor = "red"
        }
        else {
            div.style.backgroundColor = "orange"

        }
        if (count % 10000){
doLongTask()
        }
        if (on){
            frame();
        }
    })
}



function doLongTask(){
    let i = 100;
    while (i--){
        console.log("long")
    }
}