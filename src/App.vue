<template>
  <ImageInput
    @return="handleReturn"
    @update="resizeData"
    @download="downloadUnlabeled"
    @blueprint="downloadLabeled"
    v-bind="inputProp"
  ></ImageInput>
  <canvas ref="canvas"></canvas>

  <section id="palette" v-if="inputProp.isReady">
    <div v-for="color in colorList" class="color">
      <div class="preview" :style="getStyle(color)"></div>
      <span>{{ color.code + " " + color.name }}</span>
    </div>
  </section>

  <Transition>
    <section id="container" v-if="isLoading">
      <div id="spinner"></div>
      <span>Processing...</span>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import ImageInput from "./components/ImageInput.vue";
import { onMounted, Ref, ref } from "vue";
import { Color } from "./scripts/types";
import { draw, refresh, label, download } from "./scripts/CanvasProcess";

// Data
const image = document.createElement("img");
image.onload = () => {
  inputProp.value.size = [image.width, image.height, image.width / image.height];
  resizeData();
};

const imageData = document.createElement("canvas");
const canvas = ref<HTMLCanvasElement>() as Ref<HTMLCanvasElement>;
const colorList = ref<Array<Color>>();
let colorIdx: Uint16Array;

const inputProp = ref({
  size: [0, 0, 0],
  block: 8,
  k: 20,
  isReady: false,
});
const isLoading = ref(false);

const dataCtx = imageData.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
let canvasCtx: CanvasRenderingContext2D;
const worker = new Worker(new URL("./scripts/ImageWorker.ts", import.meta.url), { type: "module" });

// Methods
const getStyle = (color: Color) => ({ backgroundColor: `rgb(${color.rgb[0]} ${color.rgb[1]} ${color.rgb[2]})` });

function resizeData(width?: number, height?: number, block?: number, k?: number) {
  if (width) inputProp.value.size[0] = width;
  if (height) inputProp.value.size[1] = height;
  if (block) inputProp.value.block = block;
  if (k) inputProp.value.k = k;

  draw(image, dataCtx, 1, inputProp.value.size[0], inputProp.value.size[1]);
  resizeDisplay();
  convert();
}

function resizeDisplay() {
  const scale = Math.min(window.innerWidth / imageData.width, window.innerHeight / imageData.height);
  draw(imageData, canvasCtx, scale * 0.8);
}

function convert() {
  inputProp.value.isReady = false;
  let data = dataCtx.getImageData(0, 0, imageData.width, imageData.height).data;
  worker.postMessage(
    {
      imgData: data,
      width: imageData.width,
      height: imageData.height,
      blockSize: inputProp.value.block,
      k: inputProp.value.k,
    },
    [data.buffer]
  );

  worker.onmessage = (e) => {
    const { result, resWidth, resHeight, resColors, resIdx } = e.data;

    colorList.value = resColors;
    colorIdx = resIdx;
    refresh(result, dataCtx, resWidth, resHeight);

    resizeDisplay();
    inputProp.value.isReady = true;
    isLoading.value = false;
  };
}

function downloadUnlabeled() {
  download(imageData);
}

function downloadLabeled() {
  const blueprint = document.createElement("canvas");
  const ctx = blueprint.getContext("2d") as CanvasRenderingContext2D;

  draw(imageData, ctx, 1);
  label(ctx, colorIdx);
  download(blueprint);
  blueprint.remove();
}

function handleReturn(url: string) {
  isLoading.value = true;
  image.src = url;
}

onMounted(() => {
  window.onresize = resizeDisplay;
  canvasCtx = canvas.value.getContext("2d") as CanvasRenderingContext2D;
});
</script>

<style scoped>
#container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  position: absolute;
  left: 0px;
  bottom: 0px;
  margin: 1rem;
  padding: 1rem;

  background-color: white;
  border-radius: 1rem;
  box-shadow: 3px 3px 6px black, -3px 3px 6px black;
}

#spinner {
  border: 12px solid lightgray;
  border-top: 12px solid lightblue;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
}

#palette {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  position: absolute;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  padding: 1rem;
  overflow: auto;

  background-color: white;
  border-radius: 1rem;
  border: 2px solid black;
}

.color {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview {
  display: block;
  width: 1rem;
  height: 1rem;
}

.v-leave-to {
  opacity: 0;
}

.v-leave-active {
  transition: opacity 0.2s ease;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
