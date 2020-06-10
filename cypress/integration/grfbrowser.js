import {GrfBrowser} from '../../src/grf-browser';

const getGrfBlob = (name: string) =>
  new Cypress.Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/data/${name}`);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      resolve(
        new Blob([xhr.response], {
          type: 'application/octet-stream'
        })
      );
    };
    xhr.onerror = reject;
    xhr.send(null);
  });

describe('GRFBrowser', () => {
  it('Should not load corrupted file', async () => {
    const buffer = await getGrfBlob('corrupted.grf');
    let error = '';
    try {
      const grf = new GrfBrowser(blob);
      await grf.load();
    } catch (e) {
      error = e.message;
    }

    expect(Boolean(error)).to.be.true;
  });

  it('Should not load non-grf file', async () => {
    const blob = await getGrfBlob('not-grf.grf');

    let error = '';
    try {
      const grf = new GrfBrowser(blob);
      await grf.load();
    } catch (e) {
      error = e.message;
    }

    expect(error).to.eq('Not a GRF file (invalid signature)');
  });

  it('Should not load non 0x200 version', async () => {
    const blob = await getGrfBlob('incorrect-version.grf');

    let error = '';
    try {
      const grf = new GrfBrowser(blob);
      await grf.load();
    } catch (e) {
      error = e.message;
    }

    expect(error).to.eq('Unsupported version "0x103"');
  });

  it('Should load only once', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);

    const spy1 = cy.spy(grf, 'parseHeader');
    const spy2 = cy.spy(grf, 'parseFileList');

    await grf.load();
    await grf.load();
    await grf.load();

    expect(spy1).to.have.been.callCount(1);
    expect(spy2).to.have.been.callCount(1);
  });

  it('Should load file list data', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();

    expect(grf.fileCount).to.eq(7);
    expect(Array.from(grf.files)).to.deep.eq([
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
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    const {data, error} = await grf.getFile('raw');

    expect(data).to.eq(null);
    expect(error).to.eq('GRF not loaded yet');
  });

  it('Should reject not found file', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();
    const {data, error} = await grf.getFile('notfound');

    expect(data).to.eq(null);
    expect(error).to.eq('File "notfound" not found');
  });

  it('Should not load folder file', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();
    const {data, error} = await grf.getFile('folder');

    expect(data).to.eq(null);
    expect(error).to.eq('File "folder" not found');
  });

  it('Should reject corrupted files inside grf', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();
    const {data, error} = await grf.getFile('corrupted');

    expect(data).to.eq(null);
    expect(Boolean(error)).to.to.be.true;
  });

  it('Should load the file without compression and encryption', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();

    const {data, error} = await grf.getFile('raw');
    const result = String.fromCharCode.apply(null, data);

    expect(error).to.eq(null);
    expect(result).to.eq(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load the file with compression and no encryption', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();

    const {data, error} = await grf.getFile('compressed');
    const result = String.fromCharCode.apply(null, data);

    expect(error).to.eq(null);
    expect(result).to.eq(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load the file with partial encryption', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();

    const {data, error} = await grf.getFile('compressed-des-header');
    const result = String.fromCharCode.apply(null, data);

    expect(error).to.eq(null);
    expect(result).to.eq(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load the file with full encryption', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();

    const {data, error} = await grf.getFile('compressed-des-full');
    const result = String.fromCharCode.apply(null, data);

    expect(error).to.eq(null);
    expect(result).to.eq(
      'test test test test test test test test test test test test test test test'
    );
  });

  it('Should load big file with full encryption', async () => {
    const blob = await getGrfBlob('with-files.grf');
    const grf = new GrfBrowser(blob);
    await grf.load();

    const {data, error} = await grf.getFile('big-compressed-des-full');
    const result = String.fromCharCode.apply(null, data);

    expect(error).to.eq(null);
    expect(result).to.eq(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed venenatis bibendum venenatis. Aliquam quis velit urna. Suspendisse nec posuere sem. Donec risus quam, vulputate sed augue ultricies, dignissim hendrerit purus. Nulla euismod dolor enim, vel fermentum ex ultricies ac. Donec aliquet vehicula egestas. Sed accumsan velit ac mauris porta, id imperdiet purus aliquam. Phasellus et faucibus erat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Pellentesque vel nisl efficitur, euismod augue eu, consequat dui. Maecenas vestibulum tortor purus, egestas posuere tortor imperdiet eget. Nulla sit amet placerat diam.'
    );
  });
});
