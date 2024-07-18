import DMC from "./DMC.json";
import { type Pixel, Color, Result } from "./types";

const dmcColors: Color[] = DMC.map((color) => ({
  code: String(color.floss),
  name: color.name,
  rgb: [color.r, color.g, color.b],
}));

// Simple functions

function median(arr: number[]): number {
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function euclideanDistance(a: Pixel, b: Pixel): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function findNearestColor(colors: Pixel[]): Color[] {
  const result = new Array<Color>(colors.length);
  const available = [...dmcColors];

  for (let i = 0; i < result.length; i++) {
    let [minDistance, idx] = [Infinity, 0];
    for (let j = 0; j < available.length; j++) {
      const distance = euclideanDistance(colors[i], available[j].rgb);
      if (distance >= minDistance) continue;
      minDistance = distance;
      idx = j;
    }
    result[i] = available[idx];
    available.splice(idx, 1);
  }

  return result;
}

// Complex methods

export function pixelate(
  img: Uint8ClampedArray,
  w: number,
  h: number,
  size: number
): Omit<Result, "colors" | "indices"> {
  const [width, height] = [Math.ceil(w / size), Math.ceil(h / size)];
  const output = new Uint8ClampedArray(width * height * 4);
  const temp = Array.from(img);

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const [x1, x2] = [j * size, Math.min((j + 1) * size, w)];
      const [y1, y2] = [i * size, Math.min((i + 1) * size, h)];

      const newBlock = Array.from({ length: y2 - y1 }, (_, k) =>
        temp.slice(((y1 + k) * w + x1) * 4, ((y1 + k) * w + x2) * 4)
      ).flat();

      output[(i * width + j) * 4] = median(newBlock.filter((_, k) => k % 4 === 0));
      output[(i * width + j) * 4 + 1] = median(newBlock.filter((_, k) => k % 4 === 1));
      output[(i * width + j) * 4 + 2] = median(newBlock.filter((_, k) => k % 4 === 2));
      output[(i * width + j) * 4 + 3] = 255;
    }
  }

  return { data: output, width, height };
}

export function cluster( // K-Means Clustering
  img: Uint8ClampedArray,
  w: number,
  h: number,
  k: number,
  maxIter: number = 10
): Omit<Result, "width" | "height"> {
  const pixels = [] as Pixel[];
  for (let i = 0; i < w * h; i++) {
    pixels.push([img[i * 4], img[i * 4 + 1], img[i * 4 + 2]]);
  }

  const assign = new Uint16Array(pixels.length);
  const colors = new Array<Pixel>(k).fill([0, 0, 0]).map(() => pixels[Math.floor(Math.random() * pixels.length)]);

  for (let iter = 0; iter < maxIter; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let minDistance = Infinity;
      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(pixels[i], colors[j]);
        if (distance >= minDistance) continue;
        minDistance = distance;
        assign[i] = j;
      }
    }

    for (let i = 0; i < k; i++) {
      const filtered = pixels.filter((_, j) => assign[j] === i);
      if (!filtered.length) continue;
      colors[i] = filtered
        .reduce((sum, x) => [sum[0] + x[0], sum[1] + x[1], sum[2] + x[2]])
        .map((channel) => channel / filtered.length) as Pixel;
    }
  }

  const nearestColors = findNearestColor(colors);
  const output = new Uint8ClampedArray(img.length);
  for (let i = 0; i < w * h; i++) {
    output[i * 4] = nearestColors[assign[i]].rgb[0];
    output[i * 4 + 1] = nearestColors[assign[i]].rgb[1];
    output[i * 4 + 2] = nearestColors[assign[i]].rgb[2];
    output[i * 4 + 3] = 255;
  }

  return { data: output, colors: nearestColors, indices: assign };
}

export function rescale(img: Uint8ClampedArray, w: number, h: number): Omit<Result, "colors" | "indices"> {
  const [width, height] = [w * 24, h * 24];
  const output = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [srcX, srcY] = [Math.floor(x / 24), Math.floor(y / 24)];
      const [srcIdx, idx] = [(srcY * w + srcX) * 4, (y * width + x) * 4];
      output[idx] = img[srcIdx];
      output[idx + 1] = img[srcIdx + 1];
      output[idx + 2] = img[srcIdx + 2];
      output[idx + 3] = img[srcIdx + 3];
    }
  }

  return { data: output, width, height };
}
