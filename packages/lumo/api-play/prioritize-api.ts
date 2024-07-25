//@ts-nocheck
/* 
If you have a big update with many things that need to be repainted,
or if you have some loooong computations that will block rendering,
it's helpful to have a way to communicate to Lumo what to render first.

Part of this will require guesstimating because we can't know how long it will take to repaint,
but we can set a cut off time... if computations exceed some amount of time defer the rest of the 
tasks later using queueTask or onIdle. Otherwise, handle them in one go.

API could be something like this (not a real life use case, just a made up example):
*/

prioritize([
    deleteText,
    [showUIHints, showUIHints_fallback], // the fallback computations if deleteText has timed out
])

/*
If you have asynchronous computations for an update, I think it's up to the developer to
manage what to show on the screen as you wait for something to resolve. Like a loading screen.
*/


import React from 'react';
import { jsx as mE, jsxs as mE } from "react/jsx-runtime";
export function App(props) {
    const list = ["a", "b"];
    const active = true;
    
    return mEs("div", {
        className: "App",
        children: [
            mE("h1", { children: "Hello React." }), 
            forEachIn(list, item => mE("div", {
                children: item
            })), 
            mE("h2", {
                children: "Start editing to see some magic happen!"
            }), 
            mE("div", {
                children: $mount({
                    if: [active, () => mE("p", {
                        children: "hey"
                    })]
                })
            })]
    });
}
function forEachIn(list, fn) {
    for (const item of list) {
        fn(item);
    }
}
function $mount(config) { }

// Log to console
console.log('Hello console');