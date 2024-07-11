<template>
  <ImageInput @return="handleReturn" @update="resizeData" :size="imageSize"></ImageInput>
  <canvas ref="canvas"></canvas>
  <canvas ref="imageData" hidden></canvas>
  <img ref="image" @load="loadImage" hidden>
</template>

<script setup lang="ts">
import ImageInput from "./components/ImageInput.vue";
import { onMounted, ref } from "vue";

const image = ref<HTMLImageElement>();
const imageData = ref<HTMLCanvasElement>();
const canvas = ref<HTMLCanvasElement>();
const imageSize = ref([0, 0, 0]);

function loadImage() {
  if (!image.value || !imageData.value) return;
  imageSize.value = [image.value.width, image.value.height, image.value.width / image.value.height];
  resizeData();
  resizeDisplay();
}

function resizeData(width?: number, height?: number) {
  if (!image.value || !imageData.value) return;
  if (width) imageSize.value[0] = width;
  if (height) imageSize.value[1] = height;

  imageData.value.width = imageSize.value[0];
  imageData.value.height = imageSize.value[1];
  imageData.value.getContext("2d")?.drawImage(image.value, 0, 0, imageSize.value[0], imageSize.value[1]);
}

function resizeDisplay() {
  if (!imageData.value || !canvas.value) return;
  const scale = Math.min(window.innerWidth / imageData.value.width, window.innerHeight / imageData.value.height);
  canvas.value.width = imageData.value.width * scale * 0.8;
  canvas.value.height = imageData.value.height * scale * 0.8;
  canvas.value.getContext("2d")?.drawImage(imageData.value, 0, 0, canvas.value.width, canvas.value.height);
}

function handleReturn(url: string) {
  if (!image.value) return;
  image.value.src = url;
}

onMounted(() => {
  window.onresize = resizeDisplay;
});
</script>
