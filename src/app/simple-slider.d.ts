declare module 'd3-simple-slider' {
    import { ScaleTime, ScaleLinear } from 'd3-scale';
  
    interface Slider<T> {
      min(value: T): Slider<T>;
      max(value: T): Slider<T>;
      width(value: number): Slider<T>;
      tickFormat(format: (value: T) => string): Slider<T>;
      ticks(count: number): Slider<T>;
      default(value: [T, T]): Slider<T>;
      fill(color: string): Slider<T>;
      on(event: string, listener: (value: [T, T]) => void): Slider<T>;
    }
  
    export function sliderBottom<T = number>(
      scale?: ScaleTime<number, number> | ScaleLinear<number, number>
    ): Slider<T>;
  }
  