<script setup>
import Bullet from "./Bullet.vue"
import {onBeforeMount, onBeforeUpdate, onMounted, onUpdated, onUnmounted, onPreunmount} from "vue"
const props = defineProps({item: String, index: Number})
console.log(props.index, "COMP: running setup")

    
onBeforeMount(()=>{
  console.log(props.index, "COMP: before mount")
})

onMounted(()=>{
  console.log(props.index, "COMP: mounted")
})

onBeforeUpdate(()=>{
  console.log(props.index, "COMP: before update")
})

onUpdated(()=>{
  console.log(props.index, "COMP: updated")
})

onPreunmount(()=>{
  console.log(props.index, "COMP: before unmount")
})

onUnmounted(()=>{
  console.log(props.index, "COMP: unmounted")
})
</script>

<template>
  <li><Bullet/>{{ props.item }}</li>
</template>