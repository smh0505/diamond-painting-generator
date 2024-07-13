<template>
  <section>
    <button @click="imageInput?.click()">Upload Image</button>
    <input type="file" accept="image/*" @change="updateFile" ref="imageInput" hidden />

    <fieldset>
      <legend>Target</legend>

      <input type="radio" name="width" v-model="direction" value="width" />
      <label for="width" @click="direction = 'width'">Width</label>
      <input
        type="number"
        name="width"
        v-model="width"
        :disabled="direction === 'height'"
        @change="roundSize(direction)"
      />

      <input type="radio" name="height" v-model="direction" value="height" />
      <label for="height" @click="direction = 'height'">Height</label>
      <input
        type="number"
        name="height"
        v-model="height"
        :disabled="direction === 'width'"
        @change="roundSize(direction)"
      />

      <br />
      <label for="block">Block Size</label>
      <input type="number" name="block" v-model="blockSize" @change="blockSize = clamp(blockSize, 2)" />

      <br />
      <label for="k"># Colors</label>
      <input type="number" name="k" v-model="kValue" @change="kValue = clamp(kValue, 10)" />

      <button @click="updateSize" :disabled="!isReady">Update</button>
      
      <button @click="emitDownload" :disabled="!isReady">Download</button>
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
const blockSize = ref(8);
const kValue = ref(20);

// Props and Emits
const props = defineProps({
  size: { type: Array<number>, required: true },
  block: { type: Number, required: true },
  k: { type: Number, required: true },
  isReady: { type: Boolean, required: true },
});

watch(props, (props) => {
  width.value = props.size[0];
  height.value = props.size[1];
  ratio.value = props.size[2];
  blockSize.value = props.block;
  kValue.value = props.k;
});

const emit = defineEmits<{
  return: [url: string];
  update: [width: number, height: number, block: number, k: number];
  download: []
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
  emit("update", width.value, height.value, blockSize.value, kValue.value);
}

function emitDownload() {
  emit("download")
}

function roundSize(direction: "width" | "height") {
  switch (direction) {
    case "width":
      width.value = Math.floor(width.value);
      height.value = Math.floor(width.value / ratio.value);
      break;
    case "height":
      height.value = Math.floor(height.value);
      width.value = Math.floor(height.value * ratio.value);
  }
}

function clamp(value: number, min: number) {
  return Math.floor(Math.max(value, min));
}
</script>

<style scoped>
section {
  position: absolute;
  margin: 1rem;
  padding: 1rem;
  top: 0px;
  left: 0px;

  background-color: white;
  border-radius: 1rem;
  border: 2px solid black;
}

fieldset {
  display: grid;
  grid-template-columns: 1.75rem 6rem 1fr;
  row-gap: 0.5rem;
}

fieldset input[type="radio"] {
  margin-right: 0.5rem;
}

fieldset label {
  user-select: none;
}

fieldset button {
  grid-column: 1 / 4;
}
</style>
