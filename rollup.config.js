import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';

const {name} = require('./package.json');

const exportFormat = (format) => ({
  input: 'src/grf-browser.ts',
  output: {
    name,
    format,
    file: `dist/${format}/${name}.js`
  },
  plugins: [
    typescript(),
    terser({
      toplevel: true,
      compress: {
        unsafe: true
      }
    })
  ]
});

export default ['umd', 'cjs', 'esm'].map(exportFormat);
