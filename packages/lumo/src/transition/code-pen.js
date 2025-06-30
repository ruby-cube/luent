const p = document.querySelector("p");

const div = document.querySelector("#style-container");

const divIO = document.querySelector("#ooo-transit");

const divIO2 = document.querySelector("#i-o2");

const btn = document.querySelector("button");

let transitioning = false;
let animating = false;

let mount = true;

function toggleMount() {
    mount = !mount;
}

let controller;

let canceled = false;

btn.addEventListener("click", () => {
    if (transitioning) {
        canceled = true;
        pauseTransition();
    }
    // if (animating){
    //   pauseAnimation()
    // }

    toggleMount();

    controller = new AbortController()



    if (mount) {

        if (canceled) {
            const transitionalState = computeTransitionalState(1300, new Date().getTime() - transitioning, 0, -100, '')
            divIO.style.setProperty('transform', `translateX(${transitionalState}px)`);
            canceled = false;
        }



        divIO.classList.add("slide-right-enter-from");
        divIO.classList.add("slide-right-transition-in");
        //     divIO2.classList.add("slide-left-enter-from");
        // divIO2.classList.add("slide-left-transition-in");
        div.appendChild(divIO);
        // div.appendChild(divIO2);
        requestAnimationFrame(() => {
            divIO.style.removeProperty('transform')
            transitioning = new Date().getTime()
            // handlePhaseIn()
            phaseIOIn();
            // phaseIO2In()
            div.addEventListener(
                "transitionend",
                () => {
                    transitioning = false;
                },
                { once: true, signal: controller.signal }
            );
        });
    } else {
        if (canceled) {

            const transitionalState = computeTransitionalState(1300, new Date().getTime() - transitioning, -100, 0, '')
            divIO.style.setProperty('transform', `translateX(${transitionalState}px)`);
            canceled = false;
        }

        requestAnimationFrame(() => {
            divIO.style.removeProperty('transform')

            transitioning = new Date().getTime()
            // handlePhaseOut()
            phaseIOOut();
            // phaseIO2Out()
            div.addEventListener(
                "transitionend",
                () => {
                    transitioning = false;
                    divIO.remove();
                    // divIO2.remove();
                },
                { once: true, signal: controller.signal }
            );
        })

    }
});

function handlePhaseIn() {
    div.classList.add("transition-in");

    div.addEventListener(
        "animationend",
        () => {
            div.classList.remove("transition-in");
        },
        { once: true }
    );
}

function handlePhaseOut() {
    div.classList.add("transition-out");
    // div.classList.add("exit-to");

    div.addEventListener(
        "animationend",
        () => {
            // div.classList.remove("exit-to");
            div.classList.remove("transition-out");
            // div.classList.add("transition-in");
            // div.classList.add("enter-from");
        },
        { once: true }
    );
}

function phaseIOIn() {
    divIO.classList.remove("slide-right-enter-from");

    divIO.addEventListener(
        "transitionend",
        () => {
            divIO.classList.remove("slide-right-transition-in");
        },
        { once: true, signal: controller.signal }
    );
}

function phaseIO2In() {
    // divIO2.classList.remove("slide-left-enter-from");
    divIO2.classList.add("slide-left-transition-in");

    divIO2.addEventListener(
        "animationend",
        () => {
            divIO2.classList.remove("slide-left-transition-in");
        },
        { once: true }
    );
}

function phaseIOOut() {
    divIO.classList.add("slide-right-transition-out");
    divIO.classList.add("slide-right-exit-to");

    divIO.addEventListener(
        "transitionend",
        () => {
            divIO.classList.remove("slide-right-exit-to");
            divIO.classList.remove("slide-right-transition-out");
        },
        { once: true, signal: controller.signal }
    );
}

function phaseIO2Out() {
    divIO2.classList.add("slide-left-transition-out");
    // divIO2.classList.add("slide-left-exit-to");

    divIO2.addEventListener(
        "animationend",
        () => {
            // divIO2.classList.remove("slide-left-exit-to");
            divIO2.classList.remove("slide-left-transition-out");
        },
        { once: true }
    );
}

function pauseTransition() {
    if (!mount) {
        // end transition out
        controller.abort()
        divIO.classList.remove("slide-right-exit-to");
        divIO.classList.remove("slide-right-transition-out");
        divIO.remove();
    } else {
        controller.abort()
        divIO.classList.remove("slide-right-transition-in");
    }
}

function pauseAnimation() {
    if (mount) {
    } else {
    }
}


//     const o = getComputedStyle(divIO).opacity
//     divIO.style.opacity = o;

function computeTransitionalState(duration, elapsedTime, initialState, finalState, easing) {
    //TODO: incorporate easing into computation
    const percentage = elapsedTime / duration;
    return (finalState - initialState) * percentage + initialState;
}
