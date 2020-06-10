declare module 'grf-loader' {
  export interface TFileEntry {
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
    getFile(
      filename: string
    ): Promise<{data: null | Uint8Array; error: null | string}>;
  }

  export class GrfBrowser extends Grf<File | Blob> {}
  export class GrfNode extends Grf<number> {}
}
