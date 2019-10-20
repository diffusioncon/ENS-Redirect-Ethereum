#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2
/* eslint-env es6 */
/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */

const fs = require('fs');

require('@babel/register')(require('./babelrc.js'));

const version = process.env.npm_package_version;
if (!process.env.npm_package_version){
  console.log('Error: please run "npm run render"');
  process.exit(1); // failure
}
console.log(`version ${version}`);

const React = require('react');
const ReactDOMServer = require('react-dom/server');

const Loader = require('../js/main.js').Loader;

const state = {
  version: version, // add version for cache busting
  title: null /* default: 'DigiOptions App' */
};

let ComponentFactory = React.createFactory(Loader);
let markup = ReactDOMServer.renderToStaticMarkup(ComponentFactory(state));
fs.writeFileSync('./dist/index.html', '<!DOCTYPE html>\n' + markup, 'utf8');
