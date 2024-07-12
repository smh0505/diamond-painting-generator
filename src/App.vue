<template>
  <ImageInput @return="handleReturn" @update="resizeData" v-bind="inputProp"></ImageInput>
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
});

const worker = new Worker(new URL("./scripts/ImageWorker.ts", import.meta.url));

// Methods
function loadImage() {
  if (!image.value || !imageData.value) return;
  inputProp.value.size = [image.value.width, image.value.height, image.value.width / image.value.height];
  resizeData();
}

function resizeData(width?: number, height?: number, block?: number, k?: number) {
  if (!imageData.value) return;
  if (width) inputProp.value.size[0] = width;
  if (height) inputProp.value.size[1] = height;
  if (block) inputProp.value.block = block;
  if (k) inputProp.value.k = k;

  imageData.value.width = inputProp.value.size[0];
  imageData.value.height = inputProp.value.size[1];
  convert();
}

function resizeDisplay() {
  let ctx: CanvasRenderingContext2D | null;
  if (!imageData.value || !canvas.value || !(ctx = canvas.value.getContext("2d"))) return;
  const scale = Math.min(window.innerWidth / imageData.value.width, window.innerHeight / imageData.value.height);
  canvas.value.width = imageData.value.width * scale * 0.8;
  canvas.value.height = imageData.value.height * scale * 0.8;
  ctx.drawImage(imageData.value, 0, 0, canvas.value.width, canvas.value.height);
}

function convert() {
  let ctx: CanvasRenderingContext2D | null;
  if (!image.value || !imageData.value || !(ctx = imageData.value.getContext("2d", { willReadFrequently: true })))
    return;

  ctx.drawImage(image.value, 0, 0, imageData.value.width, imageData.value.height);
  let data = ctx.getImageData(0, 0, imageData.value.width, imageData.value.height).data;
  worker.postMessage(
    {
      imgData: data,
      width: imageData.value.width,
      height: imageData.value.height,
      channels: 4,
      stoneSize: inputProp.value.block,
    },
    [data.buffer]
  );

  worker.onmessage = (e) => {
    if (!imageData.value) return;
    const stoned = e.data as Uint8ClampedArray;
    const [width, height] = [
      Math.ceil(imageData.value.width / inputProp.value.block),
      Math.ceil(imageData.value.height / inputProp.value.block),
    ];
    ctx.putImageData(new ImageData(stoned, width, height), 0, 0);
    resizeDisplay();
  };
}

function handleReturn(url: string) {
  if (!image.value) return;
  image.value.src = url;
}

onMounted(() => {
  window.onresize = resizeDisplay;
});
</script>
