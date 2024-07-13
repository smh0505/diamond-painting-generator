<template>
  <ImageInput @return="handleReturn" @update="resizeData" @download="download" v-bind="inputProp"></ImageInput>
  <canvas ref="canvas"></canvas>
  <canvas ref="imageData" hidden></canvas>
  <img ref="image" @load="loadImage" hidden />

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
import { onMounted, ref } from "vue";
import { Color } from "./scripts/types";

// Data
const image = ref<HTMLImageElement>();
const imageData = ref<HTMLCanvasElement>();
const canvas = ref<HTMLCanvasElement>();
const colorList = ref<Array<Color>>();

const inputProp = ref({
  size: [0, 0, 0],
  block: 8,
  k: 20,
  isReady: false,
});
const isLoading = ref(false);

let dataCtx: CanvasRenderingContext2D | null;
let canvasCtx: CanvasRenderingContext2D | null;
const worker = new Worker(new URL("./scripts/ImageWorker.ts", import.meta.url), { type: "module" });

// Methods
function loadImage() {
  if (!image.value || !imageData.value) return;
  inputProp.value.size = [image.value.width, image.value.height, image.value.width / image.value.height];
  resizeData();
}

function resizeData(width?: number, height?: number, block?: number, k?: number) {
  if (!image.value || !imageData.value || !dataCtx) return;
  if (width) inputProp.value.size[0] = width;
  if (height) inputProp.value.size[1] = height;
  if (block) inputProp.value.block = block;
  if (k) inputProp.value.k = k;

  imageData.value.width = inputProp.value.size[0];
  imageData.value.height = inputProp.value.size[1];
  dataCtx.drawImage(image.value, 0, 0, imageData.value.width, imageData.value.height);
  resizeDisplay();
  convert();
}

function resizeDisplay() {
  if (!imageData.value || !canvas.value || !canvasCtx) return;
  const scale = Math.min(window.innerWidth / imageData.value.width, window.innerHeight / imageData.value.height);
  canvas.value.width = imageData.value.width * scale * 0.8;
  canvas.value.height = imageData.value.height * scale * 0.8;
  canvasCtx.drawImage(imageData.value, 0, 0, canvas.value.width, canvas.value.height);
}

function convert() {
  if (!image.value || !imageData.value || !dataCtx) return;

  inputProp.value.isReady = false;
  let data = dataCtx.getImageData(0, 0, imageData.value.width, imageData.value.height).data;
  worker.postMessage(
    {
      imgData: data,
      width: imageData.value.width,
      height: imageData.value.height,
      blockSize: inputProp.value.block,
      k: inputProp.value.k,
    },
    [data.buffer]
  );

  worker.onmessage = (e) => {
    if (!imageData.value || !dataCtx) return;
    const { result, resWidth, resHeight, resColors } = e.data;

    colorList.value = resColors;
    imageData.value.width = resWidth;
    imageData.value.height = resHeight;
    dataCtx.putImageData(new ImageData(result, resWidth, resHeight), 0, 0);

    resizeDisplay();
    inputProp.value.isReady = true;
    isLoading.value = false;
  };
}

function download() {
  if (!imageData.value) return;
  imageData.value.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "image.png";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function getStyle(color: Color) {
  return {
    backgroundColor: `rgb(${color.rgb[0]} ${color.rgb[1]} ${color.rgb[2]})`,
  };
}

function handleReturn(url: string) {
  if (!image.value) return;
  isLoading.value = true;
  image.value.src = url;
}

onMounted(() => {
  if (!imageData.value || !canvas.value) return;
  window.onresize = resizeDisplay;
  dataCtx = imageData.value.getContext("2d", { willReadFrequently: true });
  canvasCtx = canvas.value.getContext("2d");
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
