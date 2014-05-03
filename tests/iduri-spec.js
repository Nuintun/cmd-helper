var should = require('should'),
    iduri = require('./coveralls')('../lib/iduri');

describe('iduri.resolve', function (){
    var meta;

    it('has no version', function (){
        meta = iduri.resolve('lepture/nico');
        meta.version.should.equal('');
    });

    it('is invalid', function (){
        meta = iduri.resolve('aBcD@0.1.5');
        should.not.exist(meta);
    });

    it('is valid', function (){
        meta = iduri.resolve('alipay-css/foo@0.1.5');
        should.exist(meta);
    });

    it('has a version', function (){
        meta = iduri.resolve('lepture/nico@0.1.5');
        meta.version.should.equal('0.1.5');
    });

    it('has a version', function (){
        meta = iduri.resolve('lepture/nico#0.1.5');
        meta.version.should.equal('0.1.5');
    });

    it('has a version', function (){
        meta = iduri.resolve('lepture.nico@0.1.5');
        meta.version.should.equal('0.1.5');
    });

    it('has family: arale', function (){
        // git type
        meta = iduri.resolve('arale');
        meta.family.should.equal('arale');

        meta = iduri.resolve('arale/base');
        meta.family.should.equal('arale');

        meta = iduri.resolve('arale.base');
        meta.family.should.equal('arale');
    });
});

describe('iduri.normalize', function (){
    it('return a/c', function (){
        iduri.normalize('a//b/../c').should.equal('a/c');
    });
});

describe('iduri.realpath', function (){
    it('return a/c', function (){
        iduri.realpath('a/c#').should.equal('a/c');
        iduri.realpath('a/c?v=1398775190746').should.equal('a/c');
    });
});

describe('iduri.relative', function (){
    it('does not parse absolute uri', function (){
        iduri.relative('a/b', '/c').should.equal('/c');
        iduri.relative('a/b#', '/c').should.equal('/c');
        iduri.relative('a/b?timestamp=1398775190746', '/c').should.equal('/c');
        iduri.relative('a/b/', '/c').should.equal('/c');
        iduri.relative('a/b/#', '/c').should.equal('/c');
        iduri.relative('a/b/?timestamp=1398775190746', '/c').should.equal('/c');
    });

    it('return relative uri', function (){
        iduri.relative('a', 'c').should.equal('./c');
        iduri.relative('a#', 'c').should.equal('./c');
        iduri.relative('a?timestamp=1398775190746', 'c').should.equal('./c');
        iduri.relative('a/b', 'c/d').should.equal('../c/d');
        iduri.relative('a/b#', 'c/d').should.equal('../c/d');
        iduri.relative('a/b?timestamp=1398775190746', 'c/d').should.equal('../c/d');
        iduri.relative('a/b', './d').should.equal('./d');
        iduri.relative('a/b#', './d').should.equal('./d');
        iduri.relative('a/b?v=1398775190746', './d').should.equal('./d');
        iduri.relative('path/to/a', 'path/to/b').should.equal('./b');
        iduri.relative('path/to/a', 'path/b').should.equal('../b');
        iduri.relative('path/to/a', 'path/b#').should.equal('../b#');
        iduri.relative('path/to/a', 'path/b?v=1398775190746').should.equal('../b?v=1398775190746');
        iduri.relative('a/b/', './d').should.equal('./d');
        iduri.relative('a/b/#', './d').should.equal('./d');
        iduri.relative('a/b/?v=1398775190746', './d').should.equal('./d');
        iduri.relative('a/b/', 'd').should.equal('../../d');
        iduri.relative('a/b/#', 'd').should.equal('../../d');
        iduri.relative('a/b/?v=1398775190746', 'd').should.equal('../../d');
        iduri.relative('a/b/', 'd#').should.equal('../../d#');
        iduri.relative('a/b/', 'd?v=1398775190746').should.equal('../../d?v=1398775190746');
    });
});

describe('iduri.absolute', function (){
    it('only absolute relative uri', function (){
        iduri.absolute('a', 'b').should.equal('b');
        iduri.absolute('a#', 'b').should.equal('b');
        iduri.absolute('a?v=1398775190746', 'b').should.equal('b');
        iduri.absolute('./a', 'b').should.equal('b');
        iduri.absolute('./a#', 'b').should.equal('b');
        iduri.absolute('./a?v=1398775190746', 'b').should.equal('b');
        iduri.absolute('./a/', 'b').should.equal('b');
        iduri.absolute('./a/#', 'b').should.equal('b');
        iduri.absolute('./a/?v=1398775190746', 'b').should.equal('b');
    });

    it('absolute relative uri', function (){
        iduri.absolute('arale/base/1.0.0/parser', './base').should.equal('arale/base/1.0.0/base');
        iduri.absolute('arale/base/1.0.0/parser#', './base').should.equal('arale/base/1.0.0/base');
        iduri.absolute('arale/base/1.0.0/parser?v=1398775190746', './base').should.equal('arale/base/1.0.0/base');
        iduri.absolute('a//b', './c').should.equal('a/c');
        iduri.absolute('a//b#', './c').should.equal('a/c');
        iduri.absolute('a//b?v=1398775190746', './c').should.equal('a/c');
        iduri.absolute('./a', './c').should.equal('./c');
        iduri.absolute('./a#', './c').should.equal('./c');
        iduri.absolute('./a?v=1398775190746', './c').should.equal('./c');
        iduri.absolute('./a//b', './c').should.equal('./a/c');
        iduri.absolute('./a//b#', './c').should.equal('./a/c');
        iduri.absolute('./a//b?v=1398775190746', './c').should.equal('./a/c');
        iduri.absolute('./a/', './c').should.equal('./a/c');
        iduri.absolute('./a/#', './c').should.equal('./a/c');
        iduri.absolute('./a/?v=1398775190746', './c').should.equal('./a/c');
        iduri.absolute('a/b', './c#').should.equal('a/c#');
        iduri.absolute('a/b', './c?v=1398775190746').should.equal('a/c?v=1398775190746');
        iduri.absolute('./a/', './c#').should.equal('./a/c#');
        iduri.absolute('./a/', './c?v=1398775190746').should.equal('./a/c?v=1398775190746');
    });
});

describe('iduri.dirname', function (){
    it('can find dirname', function (){
        iduri.dirname('a/b/c').should.equal('a/b');
    });
});

describe('iduri.basename', function (){
    it('can find basename', function (){
        iduri.basename('a/b/c').should.equal('c');
    });
});

describe('iduri.extname', function (){
    it('can find ext', function (){
        iduri.extname('a/b/c').should.equal('.js');
        iduri.extname('a/b/c.css').should.equal('.css');
        iduri.extname('a/b/c.tpl').should.equal('.tpl');
        iduri.extname('a/b/c.tpl#').should.equal('.tpl');
        iduri.extname('a/b/c.tpl?v=1398775190746').should.equal('.tpl');
        iduri.extname('a/b/c/').should.equal('');
        iduri.extname('a/b/c/#').should.equal('');
        iduri.extname('a/b/c/?v=1398775190746').should.equal('');
    });
});

describe('iduri.appendext', function (){
    it('can append ext', function (){
        iduri.appendext('a/b').should.equal('a/b.js');
        iduri.appendext('a/b/').should.equal('a/b/');
        iduri.appendext('a/b.css').should.equal('a/b.css');
        iduri.appendext('a/b.tpl').should.equal('a/b.tpl.js');
        iduri.appendext('a/b.tpl#').should.equal('a/b.tpl#');
        iduri.appendext('a/b.tpl?v=1398775190746').should.equal('a/b.tpl?v=1398775190746');
    });
});

describe('iduri.addFileExt', function (){
    it('can add file ext', function (){
        iduri.addFileExt('tpl');
        iduri.appendext('a/b.tpl').should.equal('a/b.tpl');
    });
});

describe('iduri.removeFileExt', function (){
    it('can remove file ext', function (){
        iduri.removeFileExt('tpl');
        iduri.appendext('a/b.tpl').should.equal('a/b.tpl.js');
    });
});

describe('iduri.idFromPackage', function (){
    it('generate id without format config', function (){
        iduri.idFromPackage({
            family: 'arale',
            name: 'class',
            version: '1.0.0',
            filename: 'class.js'
        }).should.equal('arale/class/1.0.0/class');
    });

    it('generate id with format config', function (){
        iduri.idFromPackage({
            family: 'alice',
            filename: 'button.css'
        }, '{{ filename }}').should.equal('button.css');

        iduri.idFromPackage({
            family: 'alice',
            filename: 'button.css'
        }, '#{{ family }}/{{ filename }}').should.equal('#alice/button.css');
    });

    it('should generate id from relative path', function (){
        iduri.idFromPackage({
            family: 'arale',
            name: 'base',
            version: '1.0.0',
            filename: 'class.js'
        }, './event.js').should.equal('./event');
    });

    it('should generate id without a filename', function (){
        iduri.idFromPackage({
            family: 'arale',
            name: 'base',
            version: '1.0.0'
        }, '').should.equal('arale/base/1.0.0/');
    });
});

describe('iduri.isAlias', function (){
    it('is not alias', function (){
        iduri.isAlias({
            spm: {
                alias: {
                    '$': 'jquery'
                }
            }
        }, 'a').should.equal(false);
    });
});

describe('iduri.parseAlias', function (){
    it('should generate id from alias', function (){
        iduri.parseAlias({
            alias: {
                'jquery': 'gallery/jquery/1.7.2/jquery'
            }
        }, 'jquery').should.equal('gallery/jquery/1.7.2/jquery');
    });

    it('should generate id from relative path', function (){
        iduri.parseAlias({
            alias: {
                'jquery': 'gallery/jquery/1.7.2/jquery'
            }
        }, './events.js').should.equal('./events');
    });

    it('is not an alias', function (){
        iduri.parseAlias({}, 'hello').should.equal('hello');
    });
});
