type ImageSrc = HTMLImageElement | HTMLCanvasElement;

export function draw(src: ImageSrc, ctx: CanvasRenderingContext2D, scale: number): void;
export function draw(src: ImageSrc, ctx: CanvasRenderingContext2D, scale: number, width: number, height: number): void;
export function draw(
  src: ImageSrc,
  ctx: CanvasRenderingContext2D,
  scale: number,
  width?: number,
  height?: number
): void {
  ctx.canvas.width = (width ?? src.width) * scale;
  ctx.canvas.height = (height ?? src.height) * scale;
  ctx.drawImage(src, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function refresh(src: Uint8ClampedArray, ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.putImageData(new ImageData(src, width, height), 0, 0);
}

export function label(ctx: CanvasRenderingContext2D, colorIdx: Uint16Array) {
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

export function download(canvas: HTMLCanvasElement) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = "image.jpg";
    link.href = url;
    link.click();

    link.remove();
    URL.revokeObjectURL(url);
  }, "image/jpg");
}
