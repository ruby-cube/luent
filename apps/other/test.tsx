import { setUpNode } from "@rue/lumo"

function App() {
    const outer_div = setUpNode('video', {})
    return (
        <video ref={outer_div}></video>
    )
}