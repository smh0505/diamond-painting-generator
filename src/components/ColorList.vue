<template>
  <section>
    <div v-for="(color, index) in colors" class="color">
      <span>{{ index }}</span>
      <div class="preview" :style="getStyle(color)"></div>
      <span>{{ color.code }}</span>
      <span>{{ color.name }}</span>
      <span style="text-align: right">{{ getCount(index) }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Color } from "../scripts/types";

const props = defineProps({
  colors: { type: Array<Color>, required: true },
  indices: { type: Uint8Array, required: true },
});

const getStyle = (color: Color) => ({
  backgroundColor: `rgb(${color.rgb[0]} ${color.rgb[1]} ${color.rgb[2]})`,
});

const getCount = (index: number) => props.indices.filter((i) => i === index).length;
</script>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  position: absolute;
  top: 1rem;
  right: 1rem;
  bottom: 1rem;
  padding: 1rem;
  overflow: auto;

  border-radius: 1rem;
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
  border: 2px solid black;
}
</style>
