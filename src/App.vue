<template>
  <ImageInput @return="handleReturn" @update="resizeData" @download="download" v-bind="inputProp"></ImageInput>
  <canvas ref="canvas"></canvas>
  <canvas ref="imageData" hidden></canvas>
  <img ref="image" @load="loadImage" hidden />
</template>

<script setup lang="ts">
import ImageInput from "./components/ImageInput.vue";
import { onMounted, ref } from "vue";

// Data
const image = ref<HTMLImageElement>();
const imageData = ref<HTMLCanvasElement>();
const canvas = ref<HTMLCanvasElement>();

const inputProp = ref({
  size: [0, 0, 0],
  block: 8,
  k: 20,
  isReady: false,
});

let dataCtx: CanvasRenderingContext2D | null;
let canvasCtx: CanvasRenderingContext2D | null;
const worker = new Worker(new URL("./scripts/ImageWorker.ts", import.meta.url));

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
    const { result, resWidth, resHeight } = e.data;
    imageData.value.width = resWidth;
    imageData.value.height = resHeight;
    dataCtx.putImageData(new ImageData(result, resWidth, resHeight), 0, 0);
    resizeDisplay();
    inputProp.value.isReady = true;
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

function handleReturn(url: string) {
  if (!image.value) return;
  image.value.src = url;
}

onMounted(() => {
  if (!imageData.value || !canvas.value) return;
  window.onresize = resizeDisplay;
  dataCtx = imageData.value.getContext("2d", { willReadFrequently: true });
  canvasCtx = canvas.value.getContext("2d");
});
</script>
