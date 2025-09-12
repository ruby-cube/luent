import { ion, Ion, toIon, toValue } from "@rue/quarky"
import { JSXNode } from "../node/makeJSXNode"
import { MaybeIon } from "../component/Input"
import { NodePod } from "../node/NodePod"

type RenderEntry<S> = S extends MaybeIon<infer I> ?
   I extends number ? (entry: number, index: number) => JSXNode
   : I extends string ? ($entry: Ion<string>, index: number) => JSXNode
   : I extends Array<infer E> | Set<infer E> ? ($entry: Ion<E>, index: number) => JSXNode
   : I extends Map<infer K, infer V> ? ($entry: Ion<[K, V]>, index: number) => JSXNode
   : I extends { [K in keyof S]: infer V } ? ($entry: Ion<[PropertyKey, V]>, index: number) => JSXNode
   : never : never

type Spreadable<K, V> = MaybeIon<number | string | Array<V> | Set<V> | Map<K, V> | { [key: PropertyKey]: V }>

export function Spread<S extends Spreadable<any, any>>(spreadable: S, render: RenderEntry<S>) {
   return new SpreadKit(spreadable, render)
}

class SpreadKit {
   constructor(
      private data: Spreadable<any, any>,
      private renderEntry: RenderEntry<Spreadable<any, any>>
   ) {

   }


      setUp(
         parent: Element,
         outerNodePod: NodePod,
      ) {
         const data = this.data
   
         const _isIonizedModel = isIonizedModel(data)
         const isDynamic = this.isDynamic = _isIonizedModel || isIon(data);
         this.outerNodePod = outerNodePod;
         const dynamicNodePod = this.dynamicNodePod = isDynamic ? outerNodePod.appendNodePod() : undefined;
   
         // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]
   
         if (isDynamic) {
            // set up watcher for updates
            // const effectCycle = getCurrentEffectCylce();
            const _data = isIon(data) ? detachedCall(data) : data // unwrap potentially nested ionized model
            let clone = createClone(data, _data)
            // let clone = isIon(data) && isIonizedModel(_data) ? shallowClone(toRaw(_data)) : undefined
            //TODO: figure out typing for Set, Map, Object vs Array
            let recording = isIonizedModel(_data) ? recordMutations(_data) : undefined
   
   
            function createClone(subject: AnyObject, state: AnyObject){
               return isIonizedModel(state) ? shallowClone(toRaw(state)) : undefined
               // return isIon(subject) && isIonizedModel(state) ? shallowClone(toRaw(state)) : undefined
            }
   
            function hasChanged(oldState: AnyObject, state: AnyObject){
   
            }
   
            watch(data, ({ current, previous }) => { // typecast as one of the options so that typescript won't complain
               // if (recording && current === previous){
               //    recording.stop()
               //    console.log('updating list via MUTATIONS')
               //    //TODO: this.applyMutations(recording.mutations)
               //    recording = recordMutations(_data)
               //    return;
               // }
               const _prevState = clone ?? toRaw(previous)
               clone = createClone(data, current)
               // clone = isIon(data) && isIonizedModel(state) ? shallowClone(_state) as any[] : undefined
               const { indicesToRemove, insertAndMoveKit, noChange } = diff(toRaw(current), _prevState, getUID)
               if (noChange) { //TODO: should we use hasChanged function in watch options instead?
                  return;
               }
               if (dynamicNodePod!.length !== _prevState.length)
                  throw new Error(`dynamicPod length ${dynamicNodePod!.length} and data length ${previous.length} are mismatched. This should never happen.`)
   
               this.castBeforeUpdate();
               this.removeItems(indicesToRemove!);
               try {
                  this.insertAndMoveItems(insertAndMoveKit!, parent);
               }
               catch (err) {
                  console.error(err, this.__DEV__asyncPath)
               }
               // console.log('updating list', state.length, _oldValue.length)
            }, { phase: POSTEVENT })
         }
         // currentItem = undefined;
         $currentIndex = undefined;
         //   popList();
         return this;
      }
   
   
      mount(
         parent: Element ,
         fragment?: DocumentFragment
      ) {
         const data = toValue(this.data);
         const $list  = toIon(this.data);
         const list = data instanceof Array ? data : data //TODO: need to implement for sets, maps, and objects
         const listKit = this;
         const isDynamic = this.isDynamic;
         const dynamicNodePod = this.dynamicNodePod!;
   
         for (let i = 0; i < list.length; i++) {
            const item = list[i]
            const $index = ion(()=>$list()?.indexOf(item))
            $currentIndex = $index;
            // this.indices.push($index)
   
            const nodePod = isDynamic ? dynamicNodePod.appendNodePod() : this.outerNodePod;
   
            if (isDynamic) {
               const flask = this.outerFlask.spawn({ type: 'view', creationScope: true })
               listKit.renderItem(item, $index, parent, nodePod, fragment, flask)
               flask.emitInitialMount()
               flaskMap.set(nodePod, flask)
            }
            else {
               listKit.renderItem(item, $index, parent, nodePod, fragment)
            }
         }
      }
}