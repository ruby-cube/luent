
//TRANSITION DRAFT


let mount = true;

function toggleMount() {
    mount = !mount;
}

let transitioning = false;
btn.addEventListener("click", () => {
    if (transitioning) return;
    transitioning = true;
    toggleMount();

    if (mount) {
        console.log('mounting')
        div.appendChild(divIO);
        div.appendChild(divIO2);
        requestAnimationFrame(() => {
            handlePhaseIn()

            phaseIOIn()
            phaseIO2In()

            div.addEventListener(
                "transitionend",
                () => {
                    transitioning = false;
                },
                { once: true }
            );
        });
    } else {
        handlePhaseOut()
        phaseIOOut()
        phaseIO2Out()

        div.addEventListener(
            "transitionend",
            () => {
                transitioning = false;
                divIO.remove();
                divIO2.remove();
            },
            { once: true }
        );
    }
});

function onMount() {
    if (phaseIn) phaseIn(() => {
        transitioning = false;
    })

    for (const node of transitionNodes) {
        node.transitionIn?.()
    }
}

function onUnmount() {
    if (phaseOut) phaseOut(endTransition)

    for (const node of transitionNodes) {
        node.transitionOut?.(node => {
            transitioning = false;
            node.remove();
        })
    }

    function endTransition() {
        transitioning = false;
        unmountNodes()
    }
}

