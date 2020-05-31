import {read} from 'fs';
import {promisify} from 'util';
import jDataview from 'jdataview';
import {GrfBase} from './grf-base';

const readP = promisify(read);

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

    await readP(fd, buffer, 0, length, offset);

    return buffer;
  }
}
