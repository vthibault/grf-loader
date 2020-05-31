declare module 'grf-loader' {
  interface TFileEntry {
    type: number;
    offset: number;
    realSize: number;
    compressedSize: number;
    lengthAligned: number;
  }

  class Grf<T> {
    constructor(fd: T);
    version: number;
    fileCount: number;
    loaded: boolean;
    files: Map<string, TFileEntry>;
    load(): Promise<void>;
    getFile(filename: string): Promise<Uint8Array>;
  }

  export const GrfBrowser: Grf<File | Blob>;
  export const GrfNode: Grf<number>;
}
