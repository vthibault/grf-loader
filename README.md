# GRF Loader

**GRF** is an archive file format that support lossless data compression used on **Ragnarok Online** to store game assets. A GRF file may contain one or more files or directories that may have been compressed (deflate) and encrypted (variant of DES).

[![roBrowser project](https://img.shields.io/badge/project-roBrowser-informational.svg)](https://github.com/vthibault/roBrowser) [![license: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)
![node](https://github.com/vthibault/grf-loader/workflows/node/badge.svg?branch=master) ![browser](https://github.com/vthibault/grf-loader/workflows/browser/badge.svg?branch=master) ![lint](https://github.com/vthibault/grf-loader/workflows/lint/badge.svg?branch=master)

## About

- 📚 Only supports GRF version 0x200.
- 🦾 It's working both on node and browser environments
- 🔐 Supports DES description.
- ✨ Avoid bloating client/server memory _(by not loading the whole file into the RAM)_
- ❌ Does not supports custom encryption

## Installation

```
npm install grf-loader
```

## Basic usage

- Load a grf file on node.js
- Load a grf from the browser
- List all files content
- Extract a file from the GRF

### Load a grf file on node.js

```ts
import {GrfNode} from 'grf-loader';
import {openSync} from 'path';

const fd = openSync('path/to/data.grf', 'r');
const grf = new GrfNode(fd);

// Start parsing the grf.
await grf.load();
```

### Load a grf from the browser

```ts
import {GrfBrowser} from 'grf-loader';

const blob = document.querySelector('input[type="file"]').files[0];
const grf = new GrfBrowser(blob);

// Start parsing the grf
await grf.load();
```

### List all files content

Once the GRF is loaded, it's possible to list all files included inside it

```ts
grf.files.forEach((entry, path) => {
  console.log(path);
});
```

### Extract a file from the GRF

Once the GRF is loaded, it's possible to extract all files you need

```ts
const {data, error} = await grf.getFile('data\\clientinfo.xml');
// data is a Uint8Array data, so we transform it into text
const content = String.fromCharCode.apply(null, data);
console.log(content);
```
