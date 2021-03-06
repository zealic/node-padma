var chai = require("chai");
var expect = chai.expect;
chai.should();

var SimpleContainer = require('../padma').SimpleContainer;

describe('SimpleContainer', function() {
  it("should be a function", function() {
    SimpleContainer.should.be.a.Function;
  });

  it("can resolve by factory binding", function(done) {
    var container = new SimpleContainer();
    container.bind('mass', {
      factory: function() {
        return 123;
      }
    });

    container.get('mass').then(function(data) {
      data.should.to.equal(123);
      done();
    }).catch(done);
  });

  it("can resolve with Singleton scope", function(done) {
    var container = new SimpleContainer();
    var name = container.bind('mass', {
      scope: 'Singleton',
      factory: function() {
        return {value: 123};
      }
    });

    name.should.to.equal('mass');
    container.get(['mass', 'mass']).then(function(data) {
      data[0].value.should.to.equal(123);
      data[0].should.to.equal(data[1]);
      done();
    }).catch(done);
  });

  it("can resolve with Transient scope", function(done) {
    var container = new SimpleContainer();
    container.bind('mass', {
      scope: 'Transient',
      factory: function() {
        return {value: 123};
      }
    });

    container.get(['mass', 'mass']).then(function(data) {
      data[0].value.should.to.equal(123);
      data[0].should.to.not.equal(data[1]);
      done();
    }).catch(done);
  });

  it("can resolve with Transient scope and $padma meta annoation", function(done) {
    var container = new SimpleContainer();
    var factory = function() {
      return {value: 123};
    };
    factory.$padma = {scope: 'Singleton'};
    container.bind('mass', { factory: factory });

    container.get(['mass', 'mass']).then(function(data) {
      data[0].value.should.to.equal(123);
      data[0].should.to.equal(data[1]);
      done();
    }).catch(done);
  });

  it("can resolve with Custom scope", function(done) {
    var container = new SimpleContainer();
    var count = 0;
    container.bind('mass', {
      scope: function() {
        count++;
        return count !== 3;
      },
      factory: function() {
        return {value: 123};
      }
    });

    container.get(['mass', 'mass', 'mass', 'mass', 'mass']).then(function(data) {
      data[0].should.to.equal(data[1]);
      data[1].should.to.not.equal(data[2]);
      data[0].should.to.not.equal(data[3]);
      data[3].should.to.equal(data[4]);
      done();
    }).catch(done);
  });

  it("can resolve constant", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('hello', 'world');
    container.get('hello').then(function(data) {
      data.should.to.equal('world');
      done();
    }).catch(done);
  });

  it("can not find binding", function(done) {
    var parent = new SimpleContainer();
    var container = new SimpleContainer(parent);
    container.get('kill').then(function() {
      done("Must be fail!");
    }).catch(function(err) {
      if(err.stack.indexOf('test\\SimpleContainer.js') === -1 &&
        err.stack.indexOf('test/SimpleContainer.js') === -1 ) {
        return done(err.toString());
      }
      done();
    });
  });

  it("can resolve constant from parent container", function(done) {
    var parent = new SimpleContainer();
    var container = new SimpleContainer(parent);
    parent.bindConstant('kill', 'roshan');
    container.get('kill').then(function(data) {
      data.should.to.equal('roshan');
      done();
    }).catch(done);
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
    }).catch(done);
  });

  it("can rebind", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('mass', 123);

    container.bindConstant('mass', 333);

    container.get('mass').then(function(data) {
      data.should.to.equal(333);
      done();
    }).catch(done);
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
    container.invoke(target).catch(done);
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
    }).catch(done);
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
    }).catch(done);
  });

  it("invoke with special name dependecies", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('var/log', 'nginx');

    var target = function(/* var/log */log) {
      log.should.to.equal('nginx');
      done();
    };
    container.invoke(target, {
      'var/log': 'nginx'
    }).catch(done);
  });

  it("try resolve dependencies", function(done) {
    var container = new SimpleContainer();
    container.bindConstant('kill', 'roshan');

    container.tryResolve('Bible').then(function(result) {
      result.hasOwnProperty('Bible').should.be.false;
    })
    .then(function() {
      return container.tryResolve(['kill', 'Bible']).then(function(result) {
        result.hasOwnProperty('kill').should.be.true;
        result.hasOwnProperty('Bible').should.be.false;
        done();
      });
    })
    .catch(done);
  });
});
