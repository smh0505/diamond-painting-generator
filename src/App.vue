<template>
  <ImageInput
    @upload="handleUpload"
    @resize="handleResize"
    @download="handleDownload"
    @blueprint="handleBlueprint"
    v-bind="inputProp"
  ></ImageInput>

  <canvas ref="canvas"></canvas>
  <ColorList v-if="inputProp.isReady" :colors="colorList" :indices="colorIdx"></ColorList>

  <Transition>
    <section id="container" v-if="isLoading">
      <div id="spinner"></div>
      <span>Processing...</span>
    </section>
  </Transition>
</template>

<script setup lang="ts">
import ImageInput from "./components/ImageInput.vue";
import ColorList from "./components/ColorList.vue";
import { onMounted, Ref, ref } from "vue";
import { Color, RequestType } from "./scripts/types";
import { draw, refresh, getDownloadUrl, download } from "./scripts/CanvasProcess";

// Data
const image = document.createElement("img");
image.onload = () => {
  inputProp.value.width = image.width;
  inputProp.value.height = image.height;
  inputProp.value.ratio = image.width / image.height;

  draw(image, dataCtx, 1, inputProp.value.width, inputProp.value.height);
  resizeDisplay();
  convert();
};

const imageData = new OffscreenCanvas(0, 0);
const dataCtx = imageData.getContext("2d", { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;

const canvas = ref<HTMLCanvasElement>() as Ref<HTMLCanvasElement>;
let canvasCtx: CanvasRenderingContext2D;

const colorList = ref(new Array<Color>());
const colorIdx = ref(new Uint8Array());

const inputProp = ref({
  width: 0,
  height: 0,
  ratio: 0,
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
      colorIdx.value = indices;
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

// Handlers
function handleUpload(url: string) {
  isLoading.value = true;
  image.src = url;
}

function handleResize(width: number, height: number, block: number, k: number) {
  inputProp.value.width = width;
  inputProp.value.height = height;
  inputProp.value.block = block;
  inputProp.value.k = k;

  isLoading.value = true;
  draw(image, dataCtx, 1, inputProp.value.width, inputProp.value.height);
  resizeDisplay();
  convert();
}

async function handleDownload() {
  const url = await getDownloadUrl(imageData);
  download(url);
  URL.revokeObjectURL(url);
}

function handleBlueprint() {
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
    [colorIdx.value.buffer]
  );
}

onMounted(() => {
  window.onresize = resizeDisplay;
  canvasCtx = canvas.value.getContext("2d") as CanvasRenderingContext2D;

  switch (localStorage.getItem("scheme")) {
    case "light":
      document.getElementById("app")?.classList.add("light");
      break;
    case "dark":
      document.getElementById("app")?.classList.add("dark");
      break;
    default:
      localStorage.setItem("scheme", "light");
      document.getElementById("app")?.classList.add("light");
  }
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

  border-radius: 1rem;
}

#spinner {
  border: 12px solid light-dark(#828b6a, #9ba384);
  border-top: 12px solid lightblue;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
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
