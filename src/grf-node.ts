import {read} from 'fs';
import {GrfBase} from './grf-base';

/**
 * Using this Node env, we work from a fd object.
 * We do not work directly with a buffer to avoid loading 2 gigas into memory.
 *
 * You can get the `fd` by using :
 * ```
 * const fd = openSync('path/to/grf', 'r');
 * const grf = new GRFNode(fd);
 * ```
 */
export class GrfNode extends GrfBase<number> {
  public async getStreamBuffer(
    fd: number,
    offset: number,
    length: number
  ): Promise<Buffer> {
    const buffer = Buffer.alloc(length);

    await new Promise((resolve, reject) =>
      read(fd, buffer, 0, length, offset, (error) =>
        error ? reject(error) : resolve()
      )
    );

    return buffer;
  }
}
