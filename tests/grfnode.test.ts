import {resolve} from 'path';
import {openSync} from 'fs';
import {GrfNode} from '../src/grf-node';

describe('GRFNode', () => {
  it('Should not load invalid fd', async () => {
    let error = '';
    try {
      const fd = 0;
      const grf = new GrfNode(fd);
      await grf.load();
    } catch (e) {
      error = e.message;
    }
    expect(error).toBeTruthy();
  });

  it('Should not load corrupted file', async () => {
    let error = '';
    try {
      const fd = openSync(resolve(__dirname, '../data/corrupted.grf'), 'r');
      const grf = new GrfNode(fd);
      await grf.load();
    } catch (e) {
      error = e.message;
    }
    expect(error).toBe('Not a GRF file (invalid signature)');
  });

  it('Should not load non-grf file', async () => {
    let error = '';
    try {
      const fd = openSync(resolve(__dirname, '../data/not-grf.grf'), 'r');
      const grf = new GrfNode(fd);
      await grf.load();
    } catch (e) {
      error = e.message;
    }
    expect(error).toBe('Not a GRF file (invalid signature)');
  });

  it('Should not load non 0x200 version', async () => {
    let error = '';
    try {
      const fd = openSync(
        resolve(__dirname, '../data/incorrect-version.grf'),
        'r'
      );
      const grf = new GrfNode(fd);
      await grf.load();
    } catch (e) {
      error = e.message;
    }
    expect(error).toBe('Unsupported version "0x103"');
  });

  it('Should load only once', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);

    // @ts-ignore
    const spy1 = spyOn(grf, 'parseHeader');
    // @ts-ignore
    const spy2 = spyOn(grf, 'parseFileList');

    await grf.load();
    await grf.load();
    await grf.load();

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });

  it('Should load file list data', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();

    expect(grf.fileCount).toBe(7);
    expect(Array.from(grf.files)).toEqual([
      [
        'folder',
        {
          compressedSize: 0,
          lengthAligned: 0,
          realSize: 0,
          type: 0,
          offset: 0
        }
      ],
      [
        'raw',
        {
          compressedSize: 74,
          lengthAligned: 74,
          realSize: 74,
          type: 1,
          offset: 0
        }
      ],
      [
        'corrupted',
        {
          compressedSize: 132,
          lengthAligned: 123,
          realSize: 20,
          type: 3,
          offset: 34
        }
      ],
      [
        'compressed',
        {
          compressedSize: 16,
          lengthAligned: 16,
          realSize: 74,
          type: 1,
          offset: 74
        }
      ],
      [
        'compressed-des-header',
        {
          compressedSize: 16,
          lengthAligned: 16,
          realSize: 74,
          type: 5,
          offset: 90
        }
      ],
      [
        'compressed-des-full',
        {
          compressedSize: 16,
          lengthAligned: 16,
          realSize: 74,
          type: 3,
          offset: 106
        }
      ],
      [
        'big-compressed-des-full',
        {
          compressedSize: 361,
          lengthAligned: 368,
          realSize: 658,
          type: 3,
          offset: 122
        }
      ]
    ]);
  });

  it('Should reject `getFile` if grf file not loaded', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    const {data, error} = await grf.getFile('raw');

    expect(data).toBe(null);
    expect(error).toBe('GRF not loaded yet');
  });

  it('Should reject not found file', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();
    const {data, error} = await grf.getFile('notfound');

    expect(data).toBe(null);
    expect(error).toBe('File "notfound" not found');
  });

  it('Should not load folder file', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();
    const {data, error} = await grf.getFile('folder');

    expect(data).toBe(null);
    expect(error).toBe('File "folder" is a directory');
  });

  it('Should reject corrupted files inside grf', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();
    const {data, error} = await grf.getFile('corrupted');

    expect(data).toBe(null);
    expect(error).toBeTruthy();
  });

  it('Should load the file without compression and encryption', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();

    const {data, error} = await grf.getFile('raw');
    const result = String.fromCharCode.apply(null, data);

    expect(error).toBe(null);
    expect(result).toBe(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load the file with compression and no encryption', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();

    const {data, error} = await grf.getFile('compressed');
    const result = String.fromCharCode.apply(null, data);

    expect(error).toBe(null);
    expect(result).toBe(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load the file with partial encryption', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();

    const {data, error} = await grf.getFile('compressed-des-header');
    const result = String.fromCharCode.apply(null, data);

    expect(error).toBe(null);
    expect(result).toBe(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load the file with full encryption', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();

    const {data, error} = await grf.getFile('compressed-des-full');
    const result = String.fromCharCode.apply(null, data);

    expect(error).toBe(null);
    expect(result).toBe(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load big file with full encryption', async () => {
    const fd = openSync(resolve(__dirname, '../data/with-files.grf'), 'r');
    const grf = new GrfNode(fd);
    await grf.load();

    const {data, error} = await grf.getFile('big-compressed-des-full');
    const result = String.fromCharCode.apply(null, data);

    expect(error).toBe(null);
    expect(result).toBe(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed venenatis bibendum venenatis. Aliquam quis velit urna. Suspendisse nec posuere sem. Donec risus quam, vulputate sed augue ultricies, dignissim hendrerit purus. Nulla euismod dolor enim, vel fermentum ex ultricies ac. Donec aliquet vehicula egestas. Sed accumsan velit ac mauris porta, id imperdiet purus aliquam. Phasellus et faucibus erat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Pellentesque vel nisl efficitur, euismod augue eu, consequat dui. Maecenas vestibulum tortor purus, egestas posuere tortor imperdiet eget. Nulla sit amet placerat diam.'
    );
  });
});
