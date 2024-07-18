import { Context2D, ImageSrc } from "./types";

export function draw(src: ImageSrc, ctx: Context2D, scale: number, width?: number, height?: number) {
  ctx.canvas.width = (width ?? src.width) * scale;
  ctx.canvas.height = (height ?? src.height) * scale;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(src, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function refresh(src: Uint8ClampedArray, ctx: OffscreenCanvasRenderingContext2D, width: number, height: number) {
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.putImageData(new ImageData(src, width, height), 0, 0);
}

export function label(ctx: Context2D, colorIdx: Uint16Array) {
  ctx.fillStyle = "white";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const columns = ctx.canvas.width / 24;
  const rows = ctx.canvas.height / 24;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const idx = colorIdx[y * columns + x];
      ctx.fillText(idx.toString(), x * 24 + 12, y * 24 + 12);
      ctx.shadowBlur++;
      ctx.fillText(idx.toString(), x * 24 + 12, y * 24 + 12);
      ctx.shadowBlur++;
      ctx.fillText(idx.toString(), x * 24 + 12, y * 24 + 12);
      ctx.shadowBlur = 6;
    }
  }
}

export async function getDownloadUrl(canvas: OffscreenCanvas) {
  return await canvas.convertToBlob({ type: "image/jpg" }).then((blob) => URL.createObjectURL(blob));
}

export function download(url: string) {
  const link = document.createElement("a");
  link.download = "image.jpg";
  link.href = url;
  link.click();

  link.remove();
  URL.revokeObjectURL(url);
}
