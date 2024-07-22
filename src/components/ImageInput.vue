<template>
  <section>
    <div id="buttons">
      <button @click="imageInput?.click()">Upload Image</button>
      <button @click="toggleTheme">Toggle Theme</button>
    </div>
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
      <input type="number" name="block" v-model="blockSize" @change="blockSize = clamp(blockSize, 1)" />

      <br />
      <label for="k"># Colors</label>
      <input type="number" name="k" v-model="kValue" @change="kValue = clamp(kValue, 10, 256)" />

      <button @click="updateSize" :disabled="!isReady">Update</button>

      <button @click="emitDownload" :disabled="!isReady">Download</button>

      <button @click="emitBlueprint" :disabled="!isReady">Blueprint</button>
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
const blockSize = ref(8);
const kValue = ref(20);

// Props
const props = defineProps({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  ratio: { type: Number, required: true },
  block: { type: Number, required: true },
  k: { type: Number, required: true },
  isReady: { type: Boolean, required: true },
});

watch(props, (props) => {
  width.value = props.width;
  height.value = props.height;
  blockSize.value = props.block;
  kValue.value = props.k;
});

// Emits
const emit = defineEmits<{
  upload: [url: string];
  resize: [width: number, height: number, block: number, k: number];
  download: [];
  blueprint: [];
}>();

const updateFile = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;

  URL.revokeObjectURL(imageUrl.value);
  imageUrl.value = URL.createObjectURL(target.files[0]);

  emit("upload", imageUrl.value);
};

const updateSize = () => emit("resize", width.value, height.value, blockSize.value, kValue.value);

const emitDownload = () => emit("download");

const emitBlueprint = () => emit("blueprint");

// Methods
function roundSize(direction: "width" | "height") {
  switch (direction) {
    case "width":
      width.value = Math.floor(width.value);
      height.value = Math.floor(width.value / props.ratio);
      break;
    case "height":
      height.value = Math.floor(height.value);
      width.value = Math.floor(height.value * props.ratio);
  }
}

function clamp(value: number, min: number, max?: number) {
  const rounded = Math.round(value);
  return max ? Math.max(Math.min(rounded, max), min) : Math.max(rounded, min);
}

function toggleTheme() {
  if (localStorage.getItem("scheme") === "light") localStorage.setItem("scheme", "dark");
  else localStorage.setItem("scheme", "light");

  document.getElementById("app")?.classList.toggle("light");
  document.getElementById("app")?.classList.toggle("dark");
}
</script>

<style scoped>
section {
  display: flex;
  gap: 0.5rem;
  flex-direction: column;

  position: absolute;
  margin: 1rem;
  padding: 1rem;
  top: 0px;
  left: 0px;

  border-radius: 1rem;
}

#buttons {
  display: flex;
  gap: 0.5rem;
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
  display: flex;
  align-items: center;
  user-select: none;
}

fieldset button {
  grid-column: 1 / 4;
}
</style>
