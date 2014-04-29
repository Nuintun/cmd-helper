/*
 * iduri
 * https://spmjs.org
 * Hsiaoming Yang <me@lepture.com>
 */
// path
var path = require('path'),
    CURDIR_RE = /^\.[/\\]+/,
    RELPATH_RE = /^\.{1,2}[/\\]+/,
    PROTOCOL_RE = /(:\/)/g,
    FILE_EXT = ['js', 'css'];

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

// resolve uri to meta info
exports.resolve = function (uri){
    // family/name@version
    // family/name#version
    // family.name@version
    // family.name#version
    var m, family, name, version,
        regex = /^([a-z][a-z0-9\-]*(?:\/|\.))?([a-zA-Z][a-zA-Z0-9\-]*)((?:@|#).*)?$/;

    m = uri.match(regex);

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
        isCurDir = CURDIR_RE.test(uri);

    uri = path.normalize(uri).replace(/\\/g, '/');
    uri = isCurDir ? './' + uri : uri;
    uri = uri.replace(PROTOCOL_RE, '$1/');

    lastChar = uri.slice(-1);

    if (lastChar === '/') return uri;

    // if it ends with #, we should return the uri without #
    if (lastChar === '#') return uri.slice(0, -1);

    // TODO ext logical
    return uri;
}
exports.normalize = normalize;

// this is very different from node's path.relative.
// if uri starts with /, it's absolute uri, we don't relative it.
// if base is `path/to/a', uri is `static/a.js`
// relative is: ../../../static/a.js
exports.relative = function (base, uri){
    var bits, dots;

    uri = normalize(uri);

    if (uri.charAt(0) === '/') return uri;

    dots = [];
    bits = normalize(base).split('/');

    if (bits.length > 1) {
        bits.forEach(function (){
            dots.push('..');
        });
        dots.pop();
        return dots.join('/') + '/' + uri;
    }

    return uri;
};

// base is `arale/base/1.0.0/parser`
// uri is `./base`
// the result should be `arale/base/1.0.0/base`
exports.absolute = function (base, uri){
    if (!RELPATH_RE.test(uri)) return normalize(uri);
    uri = path.join(path.dirname(base), uri);
    return normalize(uri);
};

exports.join = function (){
    return normalize(path.join.apply(path, arguments).replace(/\\/g, '/'));
};

exports.dirname = function (uri){
    return normalize(path.dirname(uri));
};

exports.basename = function (uri){
    return path.basename(uri);
};

// this is very different from node's path.extname.
exports.extname = function (uri){
    var index;

    if (uri.slice(-1) === '#') {
        uri = uri.slice(0, -1);
    }

    if ((index = uri.indexOf('?')) !== -1) {
        uri = uri.substring(0, index);
    }

    // default ext is js
    return unknownFile(uri) && index === -1 ? '.js' : path.extname(uri);
};

exports.appendext = function (uri){
    // Add the default `.js` extension except that the uri ends with `#`
    if (uri.slice(-1) === '#') {
        uri = uri.slice(0, -1);
    } else if (unknownFile(uri)) {
        uri += ".js";
    }
    return normalize(uri);
};

exports.parseAlias = function (pkg, name){
    var alias;

    // relative name: ./class
    if (RELPATH_RE.test(name)) {
        name = name.replace(/\.js$/i, '');
    }

    alias = getAlias(pkg);

    if (alias.hasOwnProperty(name)) {
        name = alias[name];
    }

    return normalize(name);
};

exports.isAlias = function (pkg, name){
    var alias = getAlias(pkg);
    return alias.hasOwnProperty(name);
};

exports.idFromPackage = function (pkg, filename, format){
    if (filename && !format && ~filename.indexOf('{{')) {
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

    return normalize(template(format, pkg));
};

// validate if the format is the default format
exports.validateFormat = function (format){
    var regex = /^\{\{\s*family\s*\}\}\/\{\{\s*name\s*\}\}\/\{\{\s*version\s*\}\}\/\{\{\s*filename\s*\}\}$/;
    return regex.test(format);
};

function getAlias(pkg){
    return pkg.alias || {};
}

function template(format, data){
    var placeholder, key, value,
        regex = /\{\{\s*(.*?)\s*\}\}/g,
        ret = format,
        match = regex.exec(format);

    function getData(obj, key){
        var keys = key.split('.');
        keys.forEach(function (k){
            if (obj && obj.hasOwnProperty(k)) {
                obj = obj[k];
            }
        });
        return obj || '';
    }

    while (match) {
        placeholder = match[0];
        key = match[1];
        value = getData(data, key);
        ret = ret.replace(placeholder, value);
        match = regex.exec(format);
    }

    return ret;
}