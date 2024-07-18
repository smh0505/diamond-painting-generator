import { getDownloadUrl, label, refresh } from "./CanvasProcess";
import { pixelate, cluster, rescale } from "./ImageProcess";
import { RequestType } from "./types";

self.onmessage = async (e) => {
  let { type: responseType, img, width, height } = e.data;
  switch (responseType as RequestType) {
    case "pixelate":
      const { blockSize, k } = e.data;
      const pixelated = pixelate(img, width, height, blockSize);
      const clustered = cluster(pixelated.data, pixelated.width, pixelated.height, k);
      const rescaled = rescale(clustered.data, pixelated.width, pixelated.height);
      const response = {
        type: responseType,
        data: rescaled.data,
        width: rescaled.width,
        height: rescaled.height,
        colors: clustered.colors,
        indices: clustered.indices,
      };
      self.postMessage(response, [response.data.buffer, response.indices.buffer]);
      break;
    case "print":
      const { indices } = e.data;
      const blueprint = new OffscreenCanvas(width, height);
      const ctx = blueprint.getContext("2d") as OffscreenCanvasRenderingContext2D;

      refresh(img, ctx, width, height);
      label(ctx, indices);
      const url = await getDownloadUrl(blueprint)
      self.postMessage({ type: responseType, url });
  }
};
