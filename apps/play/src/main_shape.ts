

function createMush(){
    function mush(){

    }


    mush.frog = "dfd" // This creates a new object shape and property array but only once
    mush.kermit = true
    // return new Proxy(mush, {
    //     get(target, key){
    //         if (key === 'frog') return "dfd";
    //         if (key === 'kermit') return "true";
    //         return target[key]
    //     }
    // });
    return mush;
}

const innerButton = document.querySelector("#inner")

let apple = []

innerButton?.addEventListener("click", () => {

    apple.push(createMush())
})


