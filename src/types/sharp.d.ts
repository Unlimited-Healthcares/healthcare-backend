declare module 'sharp' {
  namespace sharp {
    interface Sharp {
      resize(width?: number, height?: number, options?: ResizeOptions): Sharp;
      jpeg(options?: JpegOptions): Sharp;
      metadata(): Promise<Metadata>;
      toBuffer(): Promise<Buffer>;
    }

    interface ResizeOptions {
      fit?: string;
      withoutEnlargement?: boolean;
      [key: string]: unknown;
    }

    interface JpegOptions {
      quality?: number;
      [key: string]: unknown;
    }

    interface Metadata {
      width?: number;
      height?: number;
      format?: string;
      space?: string;
      [key: string]: unknown;
    }
  }

  function sharp(input?: Buffer | string): sharp.Sharp;
  export = sharp;
} 