import {inflate} from 'pako';
import jDataview from 'jdataview';
import {decodeFull, decodeHeader} from './des';

export interface TFileEntry {
  type: number;
  offset: number;
  realSize: number;
  compressedSize: number;
  lengthAligned: number;
}

const FILELIST_TYPE_FILE = 0x01;
const FILELIST_TYPE_ENCRYPT_MIXED = 0x02; // encryption mode 0 (header DES + periodic DES/shuffle)
const FILELIST_TYPE_ENCRYPT_HEADER = 0x04; // encryption mode 1 (header DES only)

const HEADER_SIGNATURE = 'Master of Magic';
const HEADER_SIZE = 46;
const FILE_TABLE_SIZE = Uint32Array.BYTES_PER_ELEMENT * 2;

export abstract class GrfBase<T> {
  public version = 0x200;
  public fileCount = 0;
  public loaded = false;
  public files = new Map<string, TFileEntry>();
  private fileTableOffset = 0;

  constructor(private fd: T) {}

  abstract getStreamBuffer(
    fd: T,
    offset: number,
    length: number
  ): Promise<Uint8Array>;

  public async getStreamReader(
    offset: number,
    length: number
  ): Promise<jDataview> {
    const buffer = await this.getStreamBuffer(this.fd, offset, length);

    return new jDataview(buffer, void 0, void 0, true);
  }

  public async load(): Promise<void> {
    if (!this.loaded) {
      await this.parseHeader();
      await this.parseFileList();
      this.loaded = true;
    }
  }

  private async parseHeader(): Promise<void> {
    const reader = await this.getStreamReader(0, HEADER_SIZE);

    const signature = reader.getString(15);
    if (signature !== HEADER_SIGNATURE) {
      throw new Error('Not a GRF file (invalid signature)');
    }

    reader.skip(15);
    this.fileTableOffset = reader.getUint32() + HEADER_SIZE;
    const reservedFiles = reader.getUint32();
    this.fileCount = reader.getUint32() - reservedFiles - 7;
    this.version = reader.getUint32();

    if (this.version !== 0x200) {
      throw new Error(`Unsupported version "0x${this.version.toString(16)}"`);
    }
  }

  private async parseFileList(): Promise<void> {
    // Read table list, stored information
    const reader = await this.getStreamReader(
      this.fileTableOffset,
      FILE_TABLE_SIZE
    );
    const compressedSize = reader.getUint32();
    const realSize = reader.getUint32();

    // Load the chunk and uncompress it
    const compressed = await this.getStreamBuffer(
      this.fd,
      this.fileTableOffset + FILE_TABLE_SIZE,
      compressedSize
    );

    const data = inflate(compressed, {
      //chunkSize: realSize
    });

    // Optimized version without using jDataView (faster)
    for (let i = 0, p = 0; i < this.fileCount; ++i) {
      let filename = '';
      while (data[p]) {
        filename += String.fromCharCode(data[p++]);
      }

      p++;

      // prettier-ignore
      const entry: TFileEntry = {
        compressedSize: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24),
        lengthAligned: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24),
        realSize: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24),
        type: data[p++],
        offset: data[p++] | (data[p++] << 8) | (data[p++] << 16) | (data[p++] << 24)
      };

      // Not a file (folder ?)
      if (entry.type & FILELIST_TYPE_FILE) {
        this.files.set(filename.toLowerCase(), entry);
      }
    }
  }

  private decodeEntry(data: Uint8Array, entry: TFileEntry): Uint8Array {
    // Decode the file
    if (entry.type & FILELIST_TYPE_ENCRYPT_MIXED) {
      decodeFull(data, entry.lengthAligned, entry.compressedSize);
    } else if (entry.type & FILELIST_TYPE_ENCRYPT_HEADER) {
      decodeHeader(data, entry.lengthAligned);
    }

    // No compression
    if (entry.realSize === entry.compressedSize) {
      return data;
    }

    // Uncompress
    return inflate(data, {
      //chunkSize: entry.realSize
    });
  }

  public async getFile(
    filename: string
  ): Promise<{data: null | Uint8Array; error: null | string}> {
    if (!this.loaded) {
      return Promise.resolve({data: null, error: 'GRF not loaded yet'});
    }

    const path = filename.toLowerCase();

    // Not exists
    if (!this.files.has(path)) {
      return Promise.resolve({data: null, error: `File "${path}" not found`});
    }

    const entry = this.files.get(path);

    const data = await this.getStreamBuffer(
      this.fd,
      entry.offset + HEADER_SIZE,
      entry.lengthAligned
    );

    try {
      const result = this.decodeEntry(data, entry);
      return Promise.resolve({data: result, error: null});
    } catch (error) {
      return Promise.resolve({data: null, error: error});
    }
  }
}
