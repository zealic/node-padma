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
});
