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
    }).fail(done);
  });

  it("bindDirectory - simple", function(done) {
    var container = new PadmaContainer();
    container.bindDirectory(F('bind-directory/simple')).then(function() {
      container.resolve('hello').then(function(world) {
        world.should.to.be.equals('World!');
        done();
      }).fail(done);
    }).fail(done);
  });

  it("bindDirectory - recursives", function(done) {
    var container = new PadmaContainer();
    container.bindDirectory(F('bind-directory/recursives')).then(function(retNames) {
      var names = ['hello', 'A/metadata', 'A/B/metadata', 'A/B/C/metadata'];

      retNames.should.to.members(names);
      container.resolve(names).then(function(results) {
        results[0].should.to.be.equals('World!');
        results[1].name.should.to.be.equals('A');
        results[2].name.should.to.be.equals('B');
        results[3].name.should.to.be.equals('C');
        done();
      }).fail(done);
    }).fail(done);
  });

  it("bindDirectory - default Singleton", function(done) {
    var container = new PadmaContainer();
    container.bindDirectory(F('bind-directory/simple')).then(function() {
      container.get(['default-singleton', 'default-singleton']).then(function(data) {
        data[0].should.to.equal(data[1]);
        done();
      }).fail(done);
    });
  });
});
