// vim: sts=2:ts=2:sw=2

// budo throws 'ReferenceError: Unknown option: .global' if a .babelrc.js with 'global' key exists

const presets = [
  //'@babel/preset-env',
  [
    '@babel/preset-env',
    {
      'targets': {
        'chrome': '58',
        'ie': '11'
      }
    }
  ],
  '@babel/preset-react'
];

const plugins = [
  '@babel/plugin-proposal-class-properties'
];

const ignore = [
  function (filename) {
    return filename.match(/\/node_modules\/(?!(digioptions-app\/|d3-axis\/|d3-format\/|d3-selection\/|d3-shape\/|d3-time-format\/|d3-array\/|d3-scale\/|d3-selection-multi\/|proxy-polyfill\/|.*ethereumjs-tx\/|.*eth-lib\/|swiper\/|dom7\/))/);
    //return filename.match(/\/node_modules\/(?!(digioptions-app\/|swiper\/|dom7\/))/);
  }
];

//const global = true;

module.exports = {presets, plugins, ignore};
