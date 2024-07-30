import { useEventListener } from "@rue/lumo";

const app = document.querySelector("#app");


const delay = [0, 95]

const div = document.createElement("div")
div.textContent = "Hello World"
const buttonA = document.createElement("button")
const buttonC = document.createElement("button")
buttonA.textContent = "click"
buttonC.textContent = "answer"
const answerDiv = document.createElement("div");

app?.append(div, buttonA, answerDiv, buttonC)

let backgroundColor = "red"

buttonA.addEventListener("click", randomBehavior)
const onMouseUp = useEventListener('mouseup')

onMouseUp(buttonA, (e)=>{
    
})

let _delay: number;

function randomBehavior(){
    _delay = delay[Math.round(Math.random())]
    setTimeout(()=>{
        if (backgroundColor === "red"){
            backgroundColor = div.style.backgroundColor = "blue"
        }
        else {
            backgroundColor = div.style.backgroundColor = "red"
        }
    }, _delay)
}

buttonC.addEventListener("click", ()=>{
    answerDiv.textContent = _delay.toString()
})