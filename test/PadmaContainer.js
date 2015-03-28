var chai = require("chai");
var expect = chai.expect;
chai.should();

var padma = require('../padma');
var SimpleContainer = padma.SimpleContainer;
var PadmaContainer = padma.PadmaContainer;

function F(name) {
  return __dirname + '/fixtures/' + name;
}

describe('PadmaContainer', function() {
  it("should be a function", function() {
    PadmaContainer.should.be.a.Function;
  });

  it("instance of SimpleContainer", function() {
    var container = new PadmaContainer();
    container.should.to.be.an.instanceof(SimpleContainer);
  });

  it("smoke bind test", function(done) {
    var container = new PadmaContainer();
    container.bindConstant('hello', 'world');
    container.get('hello').then(function(data) {
      data.should.to.equal('world');
      done();
    }).catch(done);
  });

  it("bindDirectory - simple", function(done) {
    var container = new PadmaContainer();
    container.bindDirectory(F('bind-directory/simple')).then(function() {
      container.resolve('hello').then(function(world) {
        world.should.to.be.equals('World!');
        done();
      }).catch(done);
    }).catch(done);
  });

  it("bindDirectory - recursives", function(done) {
    var container = new PadmaContainer();
    container.bindDirectory(F('bind-directory/recursives')).then(function(retNames) {
      var names = ['hello', 'A/metadata', 'A/B/metadata', 'A/B/C/metadata'];

      retNames.should.to.members(names);
      container.resolve(names).spread(function(a, b, c, d) {
        a.should.to.be.equals('World!');
        b.name.should.to.be.equals('A');
        c.name.should.to.be.equals('B');
        d.name.should.to.be.equals('C');
        done();
      }).catch(done);
    }).catch(done);
  });

  it("bindDirectory - default Singleton", function(done) {
    var container = new PadmaContainer();
    container.bindDirectory(F('bind-directory/simple')).then(function() {
      container.get(['default-singleton', 'default-singleton']).then(function(data) {
        data[0].should.to.equal(data[1]);
        done();
      }).catch(done);
    });
  });

  it("bindDirectory - cycle dependencies", function(done) {
    done();
    var container = new PadmaContainer();
    container.bindDirectory(F('bind-directory/cycle-depencencies')).then(function() {
      container.get('head').then(function() {
        done('Must throw error!');
      }).catch(function(err) {
        err.message.indexOf('cycle dependency').should.to.not.equal(-1);
        done();
      }).catch(done);
    });
  });
});
