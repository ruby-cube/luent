# updates

I need to figure out how to manage overlapping batched updates.. override? queue? yield?

if a update batch overlaps a single ion update, it makes sense to override the single update

but if a single ion overlaps a update batch, what happens? do we queue the update? Maybe always override and figure out other ways to
acheive queue and yield behavior?

[X] watchToRender needs to somehow access update object, via watchsubject (SOLUTION: push update during idle callback)
[ ] lazy updates for ionized models... T_T   How do you do pState?? key-value, get op, collection mutation

// TODO:
// [X] sync effects
// [X] preventing infinite loop chains, but allow effects to be triggered further down the pipeline with updated state
//     - prevention should be stopped at 'æion.value = x', do not allow effects that trigger previously triggered state by that effect chain to run
// [X] Set up base rendering effect cycle
// [ ] doAction integration
// [ ] state locks
// [ ] Set up lazy effect queue (needs to check if action was canceled)
// [ ] Set up animation queue