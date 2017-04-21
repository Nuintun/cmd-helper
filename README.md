cmd-helper
==========

>Utilities for common module definition modify from cmd-util
>
>[![NPM Version][npm-image]][npm-url]
>[![Download Status][download-image]][npm-url]
>[![Travis Status][travis-image]][travis-url]
>[![Test Coverage][coveralls-image]][coveralls-url]
>[![Dependencies][david-image]][david-url]

### Implements

- **ast**: parse cmd javascript code, do whatever you want.
- **css**: css parser.
- **iduri**: solutions for id and uri.

### Install

```
$ npm install cmd-helper
```

### Introduction

```js
var cmd = require('cmd-helper'),
  ast = cmd.ast,
  css = cmd.css,
  iduri = cmd.iduri;

// see the documentation for detailed usage !
iduri.addFileExt('tpl');
css.parse('body { color: block; }');
```

[travis-image]: http://img.shields.io/travis/nuintun/cmd-helper.svg?style=flat-square
[travis-url]: https://travis-ci.org/nuintun/cmd-helper
[coveralls-image]: http://img.shields.io/coveralls/nuintun/cmd-helper/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/nuintun/cmd-helper?branch=master
[david-image]: http://img.shields.io/david/nuintun/cmd-helper.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/cmd-helper
[npm-image]: http://img.shields.io/npm/v/cmd-helper.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/cmd-helper
[download-image]: http://img.shields.io/npm/dm/cmd-helper.svg?style=flat-square
