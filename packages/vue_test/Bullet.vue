<script setup>
import {onBeforeMount, onBeforeUpdate, onMounted, onUpdated, onUnmounted, onBeforeUnmount} from "vue"
console.log("BULLET: running setup")
onBeforeMount(()=>{
  console.log("BULLET: before mount")
})

onMounted(()=>{
  console.log("BULLET: mounted")
})

onBeforeUpdate(()=>{
  console.log("BULLET: before update")
})

onUpdated(()=>{
  console.log("BULLET: updated")
})

onBeforeUnmount(()=>{
  console.log("BULLET: before unmount")
})

onUnmounted(()=>{
  console.log("BULLET: unmounted")
})
</script>

<template>
  <span>
    ☐
  </span>
</template>
