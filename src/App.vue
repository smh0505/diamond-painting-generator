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
    <div v-for="(color, index) in colorList" class="color">
      <span>{{ index }}</span>
      <div class="preview" :style="getStyle(color)"></div>
      <span>{{ color.code }}</span>
      <span>{{ color.name }}</span>
      <span style="text-align: right">{{ getCount(index) }}</span>
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
import { Color, RequestType } from "./scripts/types";
import { draw, refresh, getDownloadUrl, download } from "./scripts/CanvasProcess";

// Data
const image = document.createElement("img");
image.onload = () => {
  inputProp.value.size = [image.width, image.height, image.width / image.height];
  resizeData();
};

const imageData = new OffscreenCanvas(0, 0);
const dataCtx = imageData.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;

const canvas = ref<HTMLCanvasElement>() as Ref<HTMLCanvasElement>;
let canvasCtx: CanvasRenderingContext2D;

const colorList = ref<Array<Color>>();
let colorIdx: Uint16Array;

const inputProp = ref({
  size: [0, 0, 0],
  block: 8,
  k: 20,
  isReady: false,
});
const isLoading = ref(false);

const worker = new Worker(new URL("./scripts/ImageWorker.ts", import.meta.url), { type: "module" });
worker.onmessage = (e) => {
  switch (e.data.type as RequestType) {
    case "pixelate":
      const { data, width, height, colors, indices } = e.data;
      colorIdx = indices;
      colorList.value = Array.from(colors as Color[], (color) => ({
        code: color.code,
        name: color.name,
        rgb: color.rgb,
      }));      
      refresh(data, dataCtx, width, height);
      resizeDisplay();
      break;
    case "print":
      const { url } = e.data;
      download(url);
      URL.revokeObjectURL(url);
  }
  inputProp.value.isReady = true;
  isLoading.value = false;
};

// Methods
const getStyle = (color: Color) => ({ backgroundColor: `rgb(${color.rgb[0]} ${color.rgb[1]} ${color.rgb[2]})` });
const getCount = (index: number) => colorIdx.filter((i) => i === index).length;

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
      type: "pixelate",
      img: data,
      width: imageData.width,
      height: imageData.height,
      blockSize: inputProp.value.block,
      k: inputProp.value.k,
    },
    [data.buffer]
  );
}

async function downloadUnlabeled() {
  const url = await getDownloadUrl(imageData);
  download(url);
  URL.revokeObjectURL(url);
}

function downloadLabeled() {
  isLoading.value = true;
  let data = dataCtx.getImageData(0, 0, imageData.width, imageData.height).data;
  worker.postMessage(
    {
      type: "print",
      img: data,
      width: imageData.width,
      height: imageData.height,
      indices: colorIdx,
    },
    [colorIdx.buffer]
  );
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
  display: grid;
  grid-template-columns: 2rem 1.5rem 3.5rem 1fr 4rem;
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
