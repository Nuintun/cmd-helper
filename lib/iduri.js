/*
 * iduri
 * https://spmjs.org
 *
 * Hsiaoming Yang <me@lepture.com>
 * Nuintun <nuintun@qq.com>
 */
var template,
    path = require('path'),
    FILE_EXT = ['js', 'css'], // file extension regexp
    RELPATH_RE = /^\.{1,2}[\\/]/, // relative path regexp
    RESOLVE_RE = /^([a-z][a-z0-9\-]*(?:\/|\.))?([a-zA-Z][a-zA-Z0-9\-]*)((?:@|#).*)?$/; // resolve regexp

// micro template engine
template = (function (){
    var TMPLENG_RE = /\{\{\s*(.*?)\s*\}\}/g;

    function getData(source, key){
        var keys = key.split('.');

        for (var i = 0, len = keys.length; i < len; i++) {
            key = keys[i];

            if (source && source.hasOwnProperty(key)) {
                source = source[key];
                break;
            }
        }

        return source || '';
    }

    return function (format, data){
        return format.replace(TMPLENG_RE, function (holder, key){
            return getData(data, key);
        });
    }
}());

// add support file extension
exports.addFileExt = function (ext){
    if (typeof ext !== 'string' || ext === 'js'
        || ext === 'css' || FILE_EXT.indexOf(ext) !== -1) return;

    FILE_EXT.push(ext);
};

// remove support file extension
exports.removeFileExt = function (ext){
    var index;

    if (typeof ext !== 'string' || ext === 'js' || ext === 'css') return;

    index = FILE_EXT.indexOf(ext);

    if (index === -1) return;

    FILE_EXT.splice(index, 1);
};

// is unknown file extension
function unknownFile(uri){
    for (var i = 0, len = FILE_EXT.length; i < len; i++) {
        if (uri.lastIndexOf('.' + FILE_EXT[i]) !== -1) return false;
    }

    return true;
}

// transform path to unix mode
function unixPath(uri){
    var isCurDir = /^\.[\\/]/.test(uri);

    uri = path.normalize(uri);
    uri = isCurDir ? './' + uri : uri;

    return uri.replace(/\\/g, '/').replace(/(:\/)/g, '$1/');
}
exports.unixPath = unixPath;

// resolve uri to meta info
exports.resolve = function (uri){
    // family/name@version
    // family/name#version
    // family.name@version
    // family.name#version
    var m, family, name, version;

    m = uri.match(RESOLVE_RE);

    if (!m) return null;

    family = m[1] || '';
    family = family.replace(/\/|\.$/, '');
    name = m[2] || '';
    version = m[3] || '';
    version = version.replace(/^@|#/, '');

    if (!family) {
        if (/^[a-z][a-z0-9]*$/.test(name)) {
            family = name;
        } else {
            return null;
        }
    }

    if (!family && !name && !version) return null;

    return {
        family: family,
        name: name,
        version: version
    };
};

// normalize uri
// make sure the uri to be pretty,
// for example a//b/../c should be a/c.
function normalize(uri){
    var lastChar,
        searchIndex;

    uri = unixPath(uri);

    lastChar = uri.slice(-1);

    if (lastChar === '/') return uri;

    // if it ends with #, we should return the uri without #
    if (lastChar === '#') return uri.slice(0, -1);

    // if it has with ?, we should return the uri without search params
    if ((searchIndex = uri.indexOf('?')) !== -1) return uri.slice(0, searchIndex);

    // ext logical
    return uri;
}
exports.normalize = normalize;

// join path
function join(){
    var paths = Array.prototype.filter.call(arguments, f),
        joined = paths.join('\\');

    function f(p){
        if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
        }

        return p;
    }

    if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
        joined = joined.replace(/^[\\\/]{2,}/, '\\');
    }

    return unixPath(joined);
}
exports.join = join;

// dirname
exports.dirname = function (uri){
    return unixPath(path.dirname(uri));
};

// basename
exports.basename = function (uri){
    return unixPath(path.basename(uri));
};

// this is very different from node's path.relative.
// if uri starts with /, it's absolute uri, we don't relative it.
// if base is `path/to/a', uri is `static/a.js`
// relative is: ../../../static/a.js
exports.relative = function (base, uri){
    var bits, dots, len;

    uri = unixPath(uri);

    if (uri.charAt(0) === '/') return uri;

    dots = '';
    bits = normalize(base).split('/');
    len = bits.length;

    if (len > 1) {
        for (var i = 0; i < len - 1; i++) {
            dots += '../';
        }

        return join(dots, uri);
    }

    return uri;
};

// base is `arale/base/1.0.0/parser`
// uri is `./base`
// the result should be `arale/base/1.0.0/base`
exports.absolute = function (base, uri){
    if (!RELPATH_RE.test(uri)) return unixPath(uri);

    return join(path.dirname(base), uri);
};

// this is very different from node's path.extname.
exports.extname = function (uri){
    var index, ext;

    if (uri.slice(-1) === '#') {
        uri = uri.slice(0, -1);
    }

    if ((index = uri.indexOf('?')) !== -1) {
        uri = uri.substring(0, index);
    }

    ext = path.extname(uri);

    // default ext is js
    return ext ? ext : '.js';
};

exports.appendext = function (uri){
    // Add the default `.js` extension except that the uri ends with `#` or has '?'
    if (uri.slice(-1) !== '#' && uri.indexOf('?') === -1 && unknownFile(uri)) {
        uri += '.js';
    }

    return unixPath(uri);
};

// parse alias
function getAlias(pkg){
    pkg = pkg || {};
    return pkg.alias || {};
}

exports.parseAlias = function (pkg, name){
    var alias;

    // relative name: ./class
    if (RELPATH_RE.test(name)) {
        return unixPath(name.replace(/\.js$/i, ''));
    }

    alias = getAlias(pkg);

    if (alias.hasOwnProperty(name)) {
        name = alias[name];
    }

    return unixPath(name);
};

exports.isAlias = function (pkg, name){
    var alias = getAlias(pkg);
    return alias.hasOwnProperty(name);
};

// parse id
exports.idFromPackage = function (pkg, filename, format){
    if (filename && !format && filename.indexOf('{{') !== -1) {
        format = filename;
        filename = '';
    }

    if (!filename) {
        filename = pkg.filename || '';
    }

    if (RELPATH_RE.test(filename)) {
        return filename.replace(/\.js$/i, '');
    }

    format = format || '{{family}}/{{name}}/{{version}}/{{filename}}';
    pkg.filename = filename.replace(/\.js$/i, '');

    return unixPath(template(format, pkg));
};