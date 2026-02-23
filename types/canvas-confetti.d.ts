declare module "canvas-confetti" {
    export type Options = {
      particleCount?: number;
      angle?: number;
      spread?: number;
      startVelocity?: number;
      decay?: number;
      gravity?: number;
      drift?: number;
      ticks?: number;
      origin?: { x?: number; y?: number };
      colors?: string[];
      shapes?: ("square" | "circle")[];
      scalar?: number;
      zIndex?: number;
      disableForReducedMotion?: boolean;
    };
  
    export type GlobalOptions = {
      resize?: boolean;
      useWorker?: boolean;
    };
  
    export type CreateTypes = (options?: Options) => Promise<null> | null;
  
    interface Confetti {
      (options?: Options): Promise<null> | null;
      reset: () => void;
      create: (
        canvas: HTMLCanvasElement,
        opts?: GlobalOptions
      ) => Confetti;
    }
  
    const confetti: Confetti;
    export default confetti;
  }
  