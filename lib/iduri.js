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
    WIN_DIR_SEP_RE = /\\/g, // windows dir separators
    INVALID_SLASH_RE = /^\/{3,}/, // invalid slash
    DOT_RE = /\/\.\//g, // dot
    DOUBLE_DOT_RE = /[^/]*[^./]+[^/]*\/\.\.\//, // double dot
    DOUBLE_SLASH_RE = /([^:])\/{2,}/g, // double slash
    TRIM_START_RELATIVE_RE = /^((?:\/{1,2})?(?:\.{1,2}\/)*)([^/].*|$)/, // trim relative path at start
    VERSION_RE = /^(\d+\.){2}\d+$/, // version
    RELATIVE_RE = /^\.{1,2}[\\/]/, // relative path
    slice = Array.prototype.slice; // array slice

// micro template engine
template = (function (){
    var TMPLENG_RE = /\{\{\s*(.*?)\s*\}\}/g;

    // get data from source
    function getData(source, key){
        var keys = key.split('.');

        for (var i = 0, len = keys.length; i < len; i++) {
            key = keys[i];

            if (source && source.hasOwnProperty(key)) {
                source = source[key];
                break;
            }
        }

        // return result
        return source || '';
    }

    // template method
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

    // get ext index from array
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
    var query, queryIndex = uri.indexOf('?');

    // remove query
    if (queryIndex === -1) {
        query = '';
    } else {
        query = uri.substring(queryIndex);
        // a/b/./c/./d?debug=true ==> a/b/./c/./d
        uri = uri.substring(0, queryIndex);
    }

    // a\b\.\c\.\d ==> a/b/./c/./d
    uri = uri.replace(WIN_DIR_SEP_RE, '/');

    // ///a/b/./c/./d ==> /a/b/./c/./d
    uri = uri.replace(INVALID_SLASH_RE, '/');

    // a//b/c  ==>  a/b/c
    uri = uri.replace(DOUBLE_SLASH_RE, '$1/');

    // a/b/./c/./d ==> a/b/c/d
    uri = uri.replace(DOT_RE, '/');

    // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
    while (uri.match(DOUBLE_DOT_RE)) {
        uri = uri.replace(DOUBLE_DOT_RE, '');
    }

    // ./../a ==> ../a
    uri = uri.substring(0, 5) === './../' ? uri.substring(2) : uri;

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

    // if it ends with #, we should return the uri without #
    if (lastChar === '#') return uri.slice(0, -1);

    // if it has with ?, we should return the uri without search params
    if ((queryIndex = uri.indexOf('?')) !== -1) return uri.slice(0, queryIndex);

    // ext logical
    return uri;
}
exports.realpath = realpath;

// join
function join(){
    var paths = slice.call(arguments);
    return normalize(paths.join(path.sep));
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
    var root, dir, prefix, match,
        firstChar = uri.charAt(0);

    // if start of \/ or a relative path do nothing
    if (firstChar === '/' || firstChar === '\\'
        || RELATIVE_RE.test(uri)) return normalize(uri);

    match = realpath(base).match(TRIM_START_RELATIVE_RE);
    prefix = match[1];
    base = match[2];
    dir = dirname(uri);
    prefix = prefix === '/' ? '../' : prefix;
    root = path.relative(base.slice(-1) === '/' ? base : dirname(base), dir) || '.';
    uri = dir === '.' ? uri : uri.substring(dir.length + 1);

    return normalize(prefix + join(root, uri));
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
    if (lastChar !== '#' && lastChar !== '/'
        && uri.indexOf('?') === -1 && unknownFile(uri)) uri += '.js';

    return normalize(uri);
};

// resolve uri to meta info
exports.resolve = function (uri){
    // family/name@version
    // family/name#version
    // family.name@version
    // family.name#version
    var verSep, nameSep,
        family, name, version;

    // normalize uri
    uri = normalize(uri);
    // version separators
    verSep = Math.max(uri.lastIndexOf('@'), uri.lastIndexOf('#'));
    version = verSep === -1 ? '' : uri.substring(verSep + 1);

    // resolve version
    if (version && VERSION_RE.test(version)) {
        uri = uri.substring(0, verSep);
    } else {
        version = '';
        verSep = uri.length;
    }

    // name separators
    nameSep = uri.lastIndexOf('/');
    nameSep = nameSep === -1 ? uri.lastIndexOf('.') : nameSep;

    // resolve family and name
    if (nameSep === -1) {
        family = '';
        name = uri;
    } else {
        family = uri.substring(0, nameSep);
        name = nameSep === -1 ? uri : uri.substring(nameSep + 1, verSep);
    }

    // if family and name not exist return null
    if (!family && !name) return null;

    // if family not exist set name as family
    if (!family) family = name;

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
        if (name.length > 3 && name.slice(-3) === '.js') name = name.slice(0, -3);
        return normalize(name);
    }

    // get alias
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

// is string
function isString(str){
    return typeof str === 'string';
}

// parse id from package
exports.idFromPackage = function (pkg, format){
    var id, filename;

    // reset pkg
    pkg = pkg || {};
    // set default value
    pkg.family = isString(pkg.family) ? pkg.family : '';
    pkg.name = isString(pkg.name) ? pkg.name : '';
    pkg.version = isString(pkg.version) ? pkg.version : '';
    filename = pkg.filename = isString(pkg.filename) ? pkg.filename : '';

    // replace .js to whitespace characters
    if (filename.length > 3 && filename.slice(-3) === '.js') filename = filename.slice(0, -3);

    // reset filename
    pkg.filename = filename;

    // if filename is a relative path return
    if (RELATIVE_RE.test(filename)) return normalize(filename);

    // reset format
    format = isString(format) ? format : '{{family}}/{{name}}/{{version}}/{{filename}}';

    // get id
    id = normalize(template(format, pkg));

    //return result
    return id.slice(-1) === '/' ? id.slice(0, -1) : id;
};