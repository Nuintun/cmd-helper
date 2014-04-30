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
// ./a//b/../c should be ./a/c.
function normalize(uri){
    var firTwoChr = uri.substr(0, 2),
        isCurrDir = firTwoChr === './' || firTwoChr === '.\\';

    uri = path.normalize(uri);
    uri = isCurrDir ? './' + uri : uri;
    uri = uri.replace(/\\/g, '/'); // transform to posix mode
    uri = uri.replace(/(:\/)/g, '$1/'); // fixed protocol separator

    return uri;
}
exports.normalize = normalize;

// get realpath
// for example a/b/c# should be a/b/c.
// a/b/c?v=.0.0.1 should be a/b/c.
function realpath(uri){
    var lastChar,
        searchIndex;

    uri = normalize(uri);

    lastChar = uri.slice(-1);

    if (lastChar === '/') return uri;

    // if it ends with #, we should return the uri without #
    if (lastChar === '#') return uri.slice(0, -1);

    // if it has with ?, we should return the uri without search params
    if ((searchIndex = uri.indexOf('?')) !== -1) return uri.slice(0, searchIndex);

    // ext logical
    return uri;
}
exports.realpath = realpath;

// join
function join(base, uri){
    uri = base + path.sep + uri;

    if (path.sep === '\\') {
        if (!/^[\\\/]{2}[^\\\/]/.test(uri[0])) {
            uri = uri.replace(/^[\\\/]{2,}/, '\\');
        }
    }

    return normalize(uri);
}
exports.join = join;

// dirname
exports.dirname = function (uri){
    return normalize(path.dirname(uri));
};

// basename
exports.basename = function (uri){
    return normalize(path.basename(uri));
};

// this is very different from node's path.relative.
// if uri starts with /, it's absolute uri, we don't relative it.
// if base is `path/to/a', uri is `static/a.js`
// relative is: ../../../static/a.js
exports.relative = function (base, uri){
    var bits, dots, len;

    uri = normalize(uri);

    if (uri.charAt(0) === '/') return uri;

    dots = '';
    bits = realpath(base).split('/');
    len = bits.length;

    if (len > 1) {
        for (var i = 0; i < len - 1; i++) {
            dots += '../';
        }

        return normalize(dots + uri);
    }

    return uri;
};

// base is `arale/base/1.0.0/parser`
// uri is `./base`
// the result should be `arale/base/1.0.0/base`
exports.absolute = function (base, uri){
    if (!RELPATH_RE.test(uri)) return normalize(uri);
    return join(path.dirname(base), uri);
};

// this is very different from node's path.extname.
exports.extname = function (uri){
    var ext;

    uri = realpath(uri);
    ext = path.extname(uri);

    // default ext is js
    return ext ? ext : '.js';
};

// get uir has file extension
exports.appendext = function (uri){
    // Add the default `.js` extension except that the uri ends with `#` or has '?'
    if (uri.slice(-1) !== '#' && uri.indexOf('?') === -1 && unknownFile(uri)) {
        uri += '.js';
    }

    return normalize(uri);
};

// get alias
function getAlias(pkg){
    pkg = pkg || {};
    return pkg.alias || {};
}

// parse alias
exports.parseAlias = function (pkg, name){
    var alias;

    // relative name: ./class
    if (RELPATH_RE.test(name)) {
        return normalize(name.replace(/\.js$/i, ''));
    }

    alias = getAlias(pkg);

    if (alias.hasOwnProperty(name)) {
        name = alias[name];
    }

    return normalize(name);
};

// is alias
exports.isAlias = function (pkg, name){
    var alias = getAlias(pkg);
    return alias.hasOwnProperty(name);
};

// parse id from package
exports.idFromPackage = function (pkg, filename, format){
    if (filename && !format && filename.indexOf('{{') !== -1) {
        format = filename;
        filename = '';
    }

    if (!filename) {
        filename = pkg.filename || '';
    }

    filename = filename.replace(/\.js$/i, '');

    if (RELPATH_RE.test(filename)) {
        return normalize(filename);
    }

    pkg.filename = filename;
    format = format || '{{family}}/{{name}}/{{version}}/{{filename}}';

    return normalize(template(format, pkg));
};