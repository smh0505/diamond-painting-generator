function median(arr: Uint8ClampedArray) {
  arr.sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid];
}

function stoneImage(imgData: Uint8ClampedArray, width: number, height: number, channels: number, stoneSize: number) {
  const [stonedWidth, stonedHeight] = [Math.ceil(width / stoneSize), Math.ceil(height / stoneSize)];
  const stoned = new Uint8ClampedArray(stonedHeight * stonedWidth * channels);

  // For each cell in "stoned"
  for (let i = 0; i < stonedHeight; i++) {
    for (let j = 0; j < stonedWidth; j++) {
      // Set ranges for each cell from imgData
      const rangeX = [i * stoneSize, Math.min((i + 1) * stoneSize, height)];
      const rangeY = [j * stoneSize, Math.min((j + 1) * stoneSize, width)];

      // Gather pixels from ranges
      const block = new Uint8ClampedArray((rangeX[1] - rangeX[0]) * (rangeY[1] - rangeY[0]) * channels);
      let blockIdx = 0;
      for (let x = rangeX[0]; x < rangeX[1]; x++) {
        for (let y = rangeY[0]; y < rangeY[1]; y++) {
          const pixelIdx = (x * width + y) * channels;
          for (let c = 0; c < channels; c++) {
            block[blockIdx++] = imgData[pixelIdx + c];
          }
        }
      }

      // Process median
      for (let c = 0; c < channels; c++) {
        const channelValues = new Uint8ClampedArray(block.length / channels);
        for (let k = 0; k < channelValues.length; k++) {
          channelValues[k] = block[k * channels + c];
        }
        stoned[(i * stonedWidth + j) * channels + c] = median(channelValues);
      }
    }
  }

  return stoned;
}

self.onmessage = (e) => {
  const { imgData, width, height, channels, stoneSize } = e.data;
  const result = stoneImage(imgData, width, height, channels, stoneSize);
  self.postMessage(result, [result.buffer]);
};
