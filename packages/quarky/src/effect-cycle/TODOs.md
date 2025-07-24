# updates

I need to figure out how to manage overlapping batched updates.. override? queue? yield?

if a update batch overlaps a single ion update, it makes sense to override the single update

but if a single ion overlaps a update batch, what happens? do we queue the update? Maybe always override and figure out other ways to
acheive queue and yield behavior?

[] watchForRender needs to somehow access update object, via watchsubject

