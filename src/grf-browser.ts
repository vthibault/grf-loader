import jDataview from 'jdataview';
import {GrfBase} from './grf-base';

/**
 * Using this Browser, we work from a File or Blob object.
 * We are use the FileReader API to read only some part of the file to avoid
 * loading 2 gigas into memory
 */
export class GrfBrowser extends GrfBase<File | Blob> {
  public async getStreamBuffer(
    buffer: File | Blob,
    offset: number,
    length: number
  ): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () =>
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(buffer.slice(offset, offset + length));
    });
  }
}
