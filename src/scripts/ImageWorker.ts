/**
 * The basic structure: width * height * channels
 *
 * In 1D array, the sequence is defined as
 * [ ..., k_ij0, k_ij1, k_ij2, k_ij3, ...]
 * where i = row index and j = column index
 *
 * Equivalent 3D array structure:
 * [..., [..., [k_ij0, k_ij1, k_ij2, k_ij3], ...], ...]
 */

type Pixel = [number, number, number];
interface Result {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colors: Pixel[];
}

/**
 * @param {Uint8ClampedArray} arr Given array
 * @returns {number} Median in `arr`
 */
function median(arr: Uint8ClampedArray): number {
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} Distance between two points `a` and `b`
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/**
 * @param {Uint8ClampedArray} imgData Original image data in 1D array
 * @param {number} width Width of original image
 * @param {number} height Height of original image
 * @param {number} blockSize Size of unit square block
 * @return {Omit<Result, "colors">} Pixelated image data in 1D array
 */
function pixelate(
  imgData: Uint8ClampedArray,
  width: number,
  height: number,
  blockSize: number
): Omit<Result, "colors"> {
  const [outputWidth, outputHeight] = [Math.ceil(width / blockSize), Math.ceil(height / blockSize)];
  const output = new Uint8ClampedArray(outputHeight * outputWidth * 4);

  // For each cell in output
  for (let i = 0; i < outputHeight; i++) {
    for (let j = 0; j < outputWidth; j++) {
      // Set ranges for each cell from imgData
      const rangeX = [i * blockSize, Math.min((i + 1) * blockSize, height)];
      const rangeY = [j * blockSize, Math.min((j + 1) * blockSize, width)];

      // Gather pixels from ranges
      const block = new Uint8ClampedArray((rangeX[1] - rangeX[0]) * (rangeY[1] - rangeY[0]) * 4);
      let blockIdx = 0;
      for (let x = rangeX[0]; x < rangeX[1]; x++) {
        for (let y = rangeY[0]; y < rangeY[1]; y++) {
          const pixelIdx = (x * width + y) * 4;
          block[blockIdx++] = imgData[pixelIdx];
          block[blockIdx++] = imgData[pixelIdx + 1];
          block[blockIdx++] = imgData[pixelIdx + 2];
          block[blockIdx++] = imgData[pixelIdx + 3];
        }
      }

      // Find median
      for (let c = 0; c < 4; c++) {
        const channelValues = new Uint8ClampedArray(block.length / 4);
        for (let k = 0; k < channelValues.length; k++) {
          channelValues[k] = block[k * 4 + c];
        }
        output[(i * outputWidth + j) * 4 + c] = median(channelValues);
      }
    }
  }

  return {
    data: output,
    width: outputWidth,
    height: outputHeight,
  };
}

/**
 * @param {Uint8ClampedArray} imgData Original image data in 1D array
 * @param {number} width Width of original image
 * @param {number} height Height of original image
 * @param {number} k Desired number of colors
 * @param {number} maxIter Maximum number of iteration
 * @return {Omit<Result, "width" | "height">} Clustered image data in 1D array
 */
function kMeansClustering(
  imgData: Uint8ClampedArray,
  width: number,
  height: number,
  k: number,
  maxIter: number = 10
): Omit<Result, "width" | "height"> {
  const pixelCount = width * height;
  const pixels: Pixel[] = new Array(pixelCount);
  for (let i = 0, j = 0; i < pixelCount; i++, j += 4) {
    pixels[i] = [imgData[j], imgData[j + 1], imgData[j + 2]];
  }

  const assignments = new Uint8Array(pixelCount);

  // Initialize centroids randomly
  let centroids: Pixel[] = Array(k)
    .fill(null)
    .map(() => {
      const randomIdx = Math.floor(Math.random() * pixels.length);
      return [...pixels[randomIdx]];
    });

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign pixels to centroids
    for (let i = 0; i < pixelCount; i++) {
      let minDistance = Infinity;
      let closestIdx = 0;
      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(pixels[i], centroids[j]);
        if (distance >= minDistance) continue;
        minDistance = distance;
        closestIdx = j;
      }
      assignments[i] = closestIdx;
    }

    // Update centroids
    const newCentroids: Pixel[] = Array(k)
      .fill(null)
      .map(() => [0, 0, 0]);
    const counts = new Uint32Array(k);

    for (let i = 0; i < pixelCount; i++) {
      const assignment = assignments[i];
      newCentroids[assignment][0] += pixels[i][0];
      newCentroids[assignment][1] += pixels[i][1];
      newCentroids[assignment][2] += pixels[i][2];
      counts[assignment]++;
    }

    for (let i = 0; i < k; i++) {
      if (!counts[i]) continue;
      centroids[i] = [
        Math.round(newCentroids[i][0] / counts[i]),
        Math.round(newCentroids[i][1] / counts[i]),
        Math.round(newCentroids[i][2] / counts[i]),
      ];
    }
  }

  const output = new Uint8ClampedArray(imgData.length);
  for (let i = 0, j = 0; i < pixelCount; i++, j += 4) {
    const centroid = centroids[assignments[i]];
    output[j] = centroid[0];
    output[j + 1] = centroid[1];
    output[j + 2] = centroid[2];
    output[j + 3] = imgData[j + 3];
  }

  return {
    data: output,
    colors: centroids,
  };
}

/**
 * @param {Uint8ClampedArray} imgData Original image data in 1D array
 * @param {number} width Width of original image
 * @param {number} height Height of original image
 * @param {number} blockSize Size of unit square block
 * @return {Omit<Result, "colors">} Scaled image data in 1D array
 */
function rescale(imgData: Uint8ClampedArray, width: number, height: number, blockSize: number): Omit<Result, "colors"> {
  const [outputWidth, outputHeight] = [width * blockSize, height * blockSize];
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const srcX = Math.floor(x / blockSize);
      const srcY = Math.floor(y / blockSize);
      const srcIdx = (srcY * width + srcX) * 4;
      const idx = (y * outputWidth + x) * 4;

      output[idx] = imgData[srcIdx];
      output[idx + 1] = imgData[srcIdx + 1];
      output[idx + 2] = imgData[srcIdx + 2];
      output[idx + 3] = imgData[srcIdx + 3];
    }
  }

  return {
    data: output,
    width: outputWidth,
    height: outputHeight,
  };
}

self.onmessage = (e) => {
  const { imgData, width, height, blockSize, k } = e.data;
  const { data: pixel, width: pixelWidth, height: pixelHeight } = pixelate(imgData, width, height, blockSize);
  const { data: clust } = kMeansClustering(pixel, pixelWidth, pixelHeight, k);
  const { data: result, width: resWidth, height: resHeight } = rescale(clust, pixelWidth, pixelHeight, blockSize);
  self.postMessage({ result, resWidth, resHeight }, [result.buffer]);
};
