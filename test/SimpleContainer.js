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

  it("can resolve by array", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('hello', 'world');
    container.bindConstant('kill', 'roshan');
    container.get(['hello', 'kill']).then(function(data) {
      data.should.be.an.Array;
      data[0].should.to.equal('world');
      data[1].should.to.equal('roshan');
      done();
    }, done);
  });

  it("invoke with dependencies", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('hello', 'world');
    container.bindConstant('kill', 'roshan');

    var target = function(hello, kill) {
      hello.should.to.equal('world');
      kill.should.to.equal('roshan');
      done();
    };
    container.invoke(target).fail(done);
  });

  it("invoke with local dependencies", function(done) {
    var container = new SimpleContainer();

    var target = function(hello, kill) {
      hello.should.to.equal('world');
      kill.should.to.equal('roshan');
      done();
    };
    container.invoke(target, {
      hello: 'world',
      kill: 'roshan'
    }).fail(done);
  });

  it("invoke with local overrided dependencies", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('kill', 'roshan');

    var target = function(kill) {
      kill.should.to.equal('Blade Master');
      done();
    };
    container.invoke(target, {
      kill: 'Blade Master'
    }).fail(done);
  });
});
