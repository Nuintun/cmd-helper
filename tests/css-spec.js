var fs = require('fs');
var read = function (filepath){
    return fs.readFileSync(filepath, 'utf8');
};

var path = require('path');
var should = require('should');
var css = require('./coveralls')('../lib/css');

describe('css.parse', function (){
    fs.readdirSync(__dirname + '/css-cases').forEach(function (file){
        if (!/\.css/.test(file)) return;
        file = path.basename(file, '.css');
        it('should parse ' + file, function (){
            var code = read(path.join(__dirname, 'css-cases', file + '.css')),
                json = JSON.parse(read(path.join(__dirname, 'css-cases', file + '.json'))),
                ret = css.parse(code);

            should.deepEqual(ret, json);
        });
    });

    it('should throw block not finished', function (){
        (function (){
            var code = '/*! block a */';
            css.parse(code);
        }).should.throwError('block not finished.');
    });

    it('should throw block indent error', function (){
        (function (){
            var code = '/*! block a *//*! endblock *//*! endblock a*/';
            css.parse(code);
        }).should.throwError('block indent error.');
    });
});

describe('css.walk', function (){
    it('can stop the walk', function (){
        var count = 0,
            data = read(path.join(__dirname, 'css-cases', 'block.css')),
            ret = css.parse(data);

        css.walk(ret, function (node, p){
            if (node.id === 'b') {
                return false;
            }
            count++;
        });

        count.should.equal(5);
    });

    it('can walk through', function (){
        var count = 0,
            data = read(path.join(__dirname, 'css-cases', 'block.css'));

        css.walk(data, function (node){
            count++;
        });

        count.should.equal(10);
    });
});

describe('css.stringify', function (){
    fs.readdirSync(__dirname + '/css-cases').forEach(function (file){
        if (!/\.txt/.test(file)) return;
        file = path.basename(file, '.txt');

        it('should stringify ' + file, function (){
            var code = read(path.join(__dirname, 'css-cases', file + '.css')),
                txt = read(path.join(__dirname, 'css-cases', file + '.txt'));

            code = css.stringify(css.parse(code));

            code.should.equal(txt.trim());
        });
    });

    it('can stringify with filter', function (){
        var ret, code = read(path.join(__dirname, 'css-cases', 'block.css')),
            expected = 'body { color: red }\n\n/*! block a/b/c */\na { color: black }\n/*! endblock a/b/c */';

        code = css.parse(code);

        ret = css.stringify(code, function (node){
            if (node.id === 'b') {
                return false;
            }
            if (node.id === 'a') {
                node.id = 'a/b/c';
                return node;
            }
        });

        ret.trim().should.equal(expected);
    });

    it('stringify nothing', function (){
        css.stringify('a').should.equal('a');
    });
});
