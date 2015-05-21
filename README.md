Cmd-Helper
==========

>Utilities for common module definition modify from cmd-util

>[![Build Status](https://travis-ci.org/nuintun/cmd-helper.svg?branch=master)](https://travis-ci.org/nuintun/cmd-helper)
>[![Coverage Status](https://coveralls.io/repos/nuintun/cmd-helper/badge.png)](https://coveralls.io/r/nuintun/cmd-helper)
>[![NPM version](https://badge.fury.io/js/cmd-helper.png)](https://www.npmjs.org/package/cmd-helper)
>[![Dependency Status](https://david-dm.org/nuintun/cmd-helper.png)](https://david-dm.org/nuintun/cmd-helper)

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
