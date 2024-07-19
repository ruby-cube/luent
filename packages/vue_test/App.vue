<script setup>
import { reactive, ref, onBeforeMount, onBeforeUpdate, onMounted, onUpdated, onUnmounted, onBeforeUnmount } from 'vue'
import Comp from './Comp.vue'

console.log("APP: running setup")
const list = reactive({
  name: "Shopping",
  items: ["apples", "peaches", "pears", "plums"]
})

function addToList(item) {
  list.items.push(item)
}

const inputRef = ref();

function reSubmit(e) {
  e.preventDefault()
  addToList(inputRef.value.value)
  inputRef.value.value = ""
}

onBeforeMount(()=>{
  console.log("APP: before mount")
})

onMounted(()=>{
  console.log("APP: mounted")
})

onBeforeUpdate(()=>{
  console.log("APP: before update")
})

onUpdated(()=>{
  console.log("APP: updated")
})

onBeforeUnmount(()=>{
  console.log("APP: before unmount")
})

onUnmounted(()=>{
  console.log("APP: unmounted")
})
</script>

<template>
  <h1>{{ list.name }}</h1>
  <ul>
    <Comp v-for="(item, index) in list.items" key="item" :item="item" :index="index"/>
  </ul>
  <form>
    <input ref="inputRef" @submit="reSubmit" placeholder="type something ..."/>
    <button @click="reSubmit">add</button>
  </form>
</template>
