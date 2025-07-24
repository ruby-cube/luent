# updates

I need to figure out how to manage overlapping batched updates.. override? queue? yield?

if a update batch overlaps a single ion update, it makes sense to override the single update

but if a single ion overlaps a update batch, what happens? do we queue the update? Maybe always override and figure out other ways to
acheive queue and yield behavior?

[X] watchForRender needs to somehow access update object, via watchsubject (SOLUTION: push update during idle callback)
[ ] lazy updates for ionized models... T_T   How do you do pState?? key-value, get op, collection mutation

