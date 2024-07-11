<template>
  <section>
    <button @click="imageInput?.click()">Upload Image</button>
    <input type="file" accept="image/*" @change="updateFile" ref="imageInput" hidden>

    <fieldset>
      <legend>Target</legend>

      <input type="radio" name="width" v-model="direction" value="width">
      <label for="width" @click="direction = 'width'">Width</label>
      <input 
        type="number" 
        name="width" 
        min="0" 
        v-model="width" 
        :disabled="direction === 'height'" 
        @input="height = Math.floor(width / ratio)"
      >

      <input type="radio" name="height" v-model="direction" value="height">
      <label for="height" @click="direction = 'height'">Height</label>
      <input 
        type="number" 
        name="height" 
        min="0" 
        v-model="height" 
        :disabled="direction === 'width'" 
        @input="width = Math.floor(height * ratio)"
      >

      <button @click="updateSize">Update</button>
    </fieldset>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

// Data
const imageUrl = ref("");
const imageInput = ref<HTMLInputElement>();
const direction = ref<"width" | "height">("width");
const width = ref(0);
const height = ref(0);
const ratio = ref(1);

// Props and Emits
const props = defineProps({
  size: Array<number>,
});

watch(
  () => props.size,
  (newSize) => {
    if (!newSize || newSize.length < 3) return;
    width.value = newSize[0];
    height.value = newSize[1];
    ratio.value = newSize[2];
  },
);

const emit = defineEmits<{
  return: [url: string];
  update: [width: number, height: number];
}>();

// Methods
function updateFile(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target || !target.files) return;

  URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = URL.createObjectURL(target.files[0]);

  emit("return", imageUrl.value);
}

function updateSize() {
  emit("update", width.value, height.value);
}
</script>

<style scoped>
section {
  position: absolute;
  margin: 1rem;
  top: 0px;
  left: 0px;
}

fieldset {
  display: grid;
  grid-template-columns: 1.75rem 4rem 1fr;
  row-gap: 0.5rem;
}

fieldset input[type=radio] {
  margin-right: 0.5rem;
}

fieldset label {
  user-select: none;
}

fieldset button {
  grid-column: 1 / 4;
}
</style>
