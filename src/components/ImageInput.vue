<template>
  <section>
    <button @click="imageInput?.click()">Upload Image</button>
    <input type="file" accept="image/*" @change="updateFile" ref="imageInput" hidden>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

const imageUrl = ref("");
const imageInput = ref<HTMLInputElement>();
const emit = defineEmits<{
  return: [url: string];
}>();

function updateFile(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target || !target.files) return;

  URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = URL.createObjectURL(target.files[0]);
  emit("return", imageUrl.value);
}
</script>

<style scoped>
section {
  position: absolute;
  margin: 1rem;
  top: 0px;
  left: 0px;
}
</style>
