/*
 * iduri
 * https://spmjs.org
 *
 * Hsiaoming Yang <me@lepture.com>
 * Nuintun <nuintun@qq.com>
 */
var template,
    path = require('path'),
    FILE_EXT = ['js', 'css'], // file extension
    QUERY_RE = /([^?]*)(\?*.*)/, // uri query
    WIN_DIR_SEP_RE = /\\/g, // windows dir separators
    INVALID_SLASH_RE = /^\/{3,}/, // invalid slash
    DOT_RE = /\/\.\//g, // dot
    DOUBLE_DOT_RE = /\/[^/]*[^./]+[^/]*\/\.\.\//, // double dot
    DOUBLE_SLASH_RE = /([^:])\/{2,}/g, // double slash
    RELATIVE_RE = /^\.{1,2}[\\/]/; // relative path

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
    if (!ext || typeof ext !== 'string' || ext === 'js'
        || ext === 'css' || FILE_EXT.indexOf(ext) !== -1) return;

    FILE_EXT.push(ext);
};

// remove support file extension
exports.removeFileExt = function (ext){
    var index;

    if (!ext || typeof ext !== 'string' || ext === 'js' || ext === 'css') return;

    index = FILE_EXT.indexOf(ext);

    if (index === -1) return;

    FILE_EXT.splice(index, 1);
};

// is unknown file extension
function unknownFile(uri){
    return FILE_EXT.indexOf(path.extname(uri).substring(1)) === -1;
}

// normalize uri
// make sure the uri to be pretty,
// for example a//b/../c should be a/c.
// ./a//b/../c should be ./a/c.
function normalize(uri){
    var match = uri.match(QUERY_RE),
        query = match[2];

    // a/b/./c/./d?debug=true ==> a/b/./c/./d
    uri = match[1];

    // a\b\.\c\.\d ==> a/b/./c/./d
    uri = uri.replace(WIN_DIR_SEP_RE, '/');

    // ///a/b/./c/./d ==> /a/b/./c/./d
    uri = uri.replace(INVALID_SLASH_RE, '/');

    // a/b/./c/./d ==> a/b/c/d
    uri = uri.replace(DOT_RE, '/');

    // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
    while (uri.match(DOUBLE_DOT_RE)) {
        uri = uri.replace(DOUBLE_DOT_RE, '/');
    }

    // a//b/c  ==>  a/b/c
    uri = uri.replace(DOUBLE_SLASH_RE, '$1/');

    // retrun normalize uri
    return uri + query;
}
exports.normalize = normalize;

// get realpath
// for example a/b/c# should be a/b/c.
// a/b/c?v=.0.0.1 should be a/b/c.
function realpath(uri){
    var lastChar,
        queryIndex;

    uri = normalize(uri);
    lastChar = uri.slice(-1);

    if (lastChar === '/') return uri;

    // if it ends with #, we should return the uri without #
    if (lastChar === '#') return uri.slice(0, -1);

    // if it has with ?, we should return the uri without search params
    if ((queryIndex = uri.indexOf('?')) !== -1) return uri.slice(0, queryIndex);

    // ext logical
    return uri;
}
exports.realpath = realpath;

// join
function join(base, uri){
    return normalize(base + path.sep + uri);
}
exports.join = join;

// dirname
function dirname(uri){
    return path.dirname(realpath(uri));
}
exports.dirname = dirname;

// basename
exports.basename = function (uri, ext){
    return path.basename(realpath(uri), ext);
};

// this is very different from node's path.extname.
exports.extname = function (uri){
    var ext;

    uri = realpath(uri);

    // if uri is a dir return ''
    if (uri.slice(-1) === '/') return '';

    ext = path.extname(uri);

    // default ext is js
    return ext ? ext : '.js';
};

// this is very different from node's path.relative.
// if uri starts with /, it's absolute uri, we don't relative it.
// if base is `path/to/a.js', uri is `static/a.js`
// relative is: ../../static/a.js
exports.relative = function (base, uri){
    var dir, uriDir, prefix = '';

    if (uri.charAt(0) === '/' || RELATIVE_RE.test(uri)) return normalize(uri);

    base = realpath(base).replace(/^[./]+/, function (match){
        prefix = match;
        return '';
    });
    uriDir = dirname(uri);
    prefix = prefix ? prefix.replace(/^(\/+|\.\/)/, '') : prefix;
    dir = path.relative(base.slice(-1) === '/' ? base : dirname(base), uriDir);

    return normalize(prefix + join(dir || '.', uriDir === '.' ? uri : uri.substring(uriDir.length + 1)));
};

// base is `arale/base/1.0.0/parser`
// uri is `./base`
// the result should be `arale/base/1.0.0/base`
exports.absolute = function (base, uri){
    if (!RELATIVE_RE.test(uri)) return normalize(uri);

    base = realpath(base);

    return join(base.slice(-1) === '/' ? base : dirname(base), uri);
};

// get uir has file extension
exports.appendext = function (uri){
    var lastChar = uri.slice(-1);

    // Add the default `.js` extension except that the uri ends with `#` or has '?'
    if (lastChar !== '#' && lastChar !== '/' && uri.indexOf('?') === -1 && unknownFile(uri)) {
        uri += '.js';
    }

    return normalize(uri);
};

// resolve uri to meta info
exports.resolve = function (uri){
    // family/name@version
    // family/name#version
    // family.name@version
    // family.name#version
    var family, name, version,
        verSep, nameSep;

    // normalize uri
    uri = normalize(uri);
    // version separators
    verSep = Math.max(uri.lastIndexOf('@'), uri.lastIndexOf('#'));
    version = verSep === -1 ? '' : uri.substring(verSep + 1);

    // resolve version
    if (version && /^(\d+\.){2}\d+$/.test(version)) {
        uri = uri.substring(0, verSep);
    } else {
        version = '';
        verSep = uri.length;
    }

    // name separators
    nameSep = Math.max(uri.lastIndexOf('/'), uri.lastIndexOf('\\'));
    nameSep = nameSep === -1 ? uri.lastIndexOf('.') : nameSep;

    // resolve family and name
    if (nameSep === -1) {
        family = '';
        name = uri;
    } else {
        family = uri.substring(0, nameSep);
        name = nameSep === -1 ? uri : uri.substring(nameSep + 1, verSep);
    }

    // if name empty return null
    if (!name) return null;

    // return result
    return {
        family: family,
        name: name,
        version: version
    };
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
    if (RELATIVE_RE.test(name)) {
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

    if (RELATIVE_RE.test(filename)) {
        return normalize(filename);
    }

    pkg.filename = filename;
    format = format || '{{family}}/{{name}}/{{version}}/{{filename}}';

    return normalize(template(format, pkg));
};