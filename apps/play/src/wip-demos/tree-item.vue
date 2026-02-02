<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
   item: Object
})

const isFolder = computed(() => {
   return props.item.children && props.item.children.length
})
const isOpen = ref(false)

function toggle() {
   isOpen.value = !isOpen.value
}

function changeType() {
   if (!isFolder.value) {
      props.item.children = []
      addChild()
      isOpen.value = true
   }
}

function addChild() {
   props.item.children.push({ name: 'new stuff' })
}
</script>

<template>
   <li class="item">
      <div clase="store" :class="{ bold: isFolder }" @click="toggle" @dblclick="changeType">
         {{ item.name }}
         <span v-if="isFolder">[{{ isOpen ? '-' : '+' }}]</span>
      </div>
      <ul v-show="isOpen" v-if="isFolder">
         <TreeItem v-for="item in item.children" :model="item">
         </TreeItem>
         <li class="add" @click="addChild">+</li>
      </ul>
   </li>
</template>