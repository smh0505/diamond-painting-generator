export type Pixel = [number, number, number];

export type ImageSrc = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
export type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface Color {
  code: string;
  name: string;
  rgb: Pixel;
}

export interface Result {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colors: Color[];
  indices: Uint16Array;
}

export type RequestType = "pixelate" | "print";
