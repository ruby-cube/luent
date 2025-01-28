//@ts-nocheck
//RESEARCH QUESTION 1: Should PendingStop have pause(), resume()? Should its listener be bound to a flask? If so, which flask?

watch($count, () => {

}, {
   until: [document, 'click']
   // pendingDocumentClick.stop() when watcher's _removeCallback() is called. 
   // Does listen(document, 'click', cb) need to be paused and restored along with the encompassing flask? 
   // Is there a chance that there will be a document click? that will disable the watcher? Yes.
   // So the answer is, it depends on whether there's a chance for the 'until listener' to fire when the view is unmounted
   // and then it depends on whether you want it to be able to be canceled while the view is gone.

   // PendingStop listeners do not need to be bound to a flask because they will be stopped when _removeCallback is called.
   // But you might want to pause and restore it
   //
   // in the case of flask.onUnmount or outerflask.onUnmount, is there a chance that 
})

// if you want to preserve:
listen(document, 'click', watcher.stop, { once: true, preserve: true })

watch($count, () => {

}) // internally flask.onUnmount(), flask.onDiscard(), flask.onMount()


// CONCLUSION: 
// - PendingStop should be no different from a regular listener scheduler. It should be bound to a flask, pause and resume with the flask
// - If you need to preserve the pending stop listener across temporary unmounts,
//   then you set it up as its own listener instead of using 'until' or 'cancel'.
//   the caveat is that it will not be removed when the original callback is called,
//   but that is not a huge problem. It'll just be called again and nothing will happen since the watcher has already been stopped.



// RESEARCH QUESTION 2: 
// Should flask.onUnmount(), flask.onDiscard(), flask.onMount(), be normal listeners 
// ie 
// - bound to encompassing flask
// - pause and resume with flask
// - return a listener with stop, pause, and resume
// - accept listener options
// ?

// Being bound to the encompassing flask causes an infinite loop
// But the key question is whether they ever need to pause and resume?
// I don't think so... all I see are infinite loops. 