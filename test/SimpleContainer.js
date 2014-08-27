var chai = require("chai");
var expect = chai.expect;
chai.should();

var SimpleContainer = require('../lib/padma').SimpleContainer;

describe('SimpleContainer', function() {
  it("should be a function", function() {
    SimpleContainer.should.be.a.Function;
  });

  it("can resolve constant", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('hello', 'world');
    container.get('hello').then(function(data) {
      data.should.to.equal('world');
      done();
    }, done);
  });

  it("can resolve constant from parent container", function(done) {
    var parent = new SimpleContainer();
    var container = new SimpleContainer(parent);
    parent.bindConstant('kill', 'roshan');
    container.get('kill').then(function(data) {
      data.should.to.equal('roshan');
      done();
    }, done);
  });
});
