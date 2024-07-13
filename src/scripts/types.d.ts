export type Pixel = [number, number, number];

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
}
