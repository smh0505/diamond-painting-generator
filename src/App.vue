<template>
  <ImageInput @return="handleReturn"></ImageInput>
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

function loadImage() {
  if (!image.value || !imageData.value) return;

  imageData.value.width = image.value.width;
  imageData.value.height = image.value.height;
  imageData.value.getContext("2d")?.drawImage(image.value, 0, 0);

  handleResize();
}

function handleReturn(url: string) {
  if (!image.value) return;
  image.value.src = url;
}

function handleResize() {
  if (!imageData.value || !canvas.value) return;
  const scale = Math.min(window.innerWidth / imageData.value.width, window.innerHeight / imageData.value.height);
  canvas.value.width = imageData.value.width * scale * 0.8;
  canvas.value.height = imageData.value.height * scale * 0.8;
  canvas.value.getContext("2d")?.drawImage(imageData.value, 0, 0, canvas.value.width, canvas.value.height);
}

onMounted(() => {
  window.onresize = handleResize;
});
</script>
