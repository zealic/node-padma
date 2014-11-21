var _ = require('lodash');
var Q = require('bluebird');
var parse = require('./annotation').parse;
var Store = require('./store');
var Scopes = require('./scopes');

var EMPTY = Object.create(null);

var SimpleContainer = module.exports = function (parentContainer) {
  Object.defineProperty(this, "parent", {
    enumerable: false,
    value: parentContainer
  });

  var store = new Store(parentContainer && parentContainer.store);
  Object.defineProperty(this, "store", {
    enumerable: false,
    value: store
  });
};

var proto = SimpleContainer.prototype;

function resolveCore(self, name) {
  var metadata = self.store[name];
  if(!metadata) {
    return Q.resolve(EMPTY);
  }
  if(metadata.hasOwnProperty('value')) {
    return Q.resolve(metadata.value);
  }

  return Q.resolve(null).then(function() {
    var inScope = metadata.scope();
    if(inScope && metadata.hasOwnProperty('cached')) {
      return metadata.cached;
    }
    var result = metadata.factory(metadata);
    if(inScope) {
      metadata.cached = result;
    } else {
      delete metadata['cached'];
    }
    return result;
  });
}

proto.resolve = function(name) {
  if(name instanceof Array) {
    var plist = [];
    var self = this;
    name.forEach(function(n) {
      plist.push(self.resolve(n));
    });

    return Q.all(plist);
  } else {
    var stack = new Error().stack;
    return resolveCore(this, name).then(function(ret) {
      if(ret === EMPTY) {
        var err = new Error('Can not find binding "' + name + '".');
        err.stack = stack;
        return Q.reject(err);
      }
      return ret;
    });
  }

  return Q.reject(new Error("Can not resolve service by name '" + name + "'."));
};

proto.get = proto.resolve;

proto.tryResolve = function(name) {
  var result = {};
  if(name instanceof Array) {
    var plist = [];
    var self = this;
    name.forEach(function(n) {
      plist.push(self.tryResolve(n));
    });

    return Q.all(plist).then(function(deps) {
      var ret = {};
      deps.forEach(function(dep) {
        _.merge(ret, dep);
      });
      return ret;
    });
  } else {
    return resolveCore(this, name).then(function(ret) {
      if(ret !== EMPTY) {
        result[name] = ret;
      }
      return result;
    });
  }

  return Q.resolve(result);
};

proto.bind = function(name, options) {
  if(typeof name !== 'string') {
    throw new Error('name must be a string.');
  }
  if(options.value) {
    this.bindConstant(name, options.value);
    return name;
  }
  if(!options.factory) {
    throw new Error('options.factory is required.');
  }
  if(typeof options.factory !== 'function') {
    throw new Error('options.factory must be a function.');
  }

  var opts = {};
  _.merge(opts, options);
  if(options.factory && options.factory.$padma) {
    _.merge(opts, options.factory.$padma);
    opts.factory = options.factory;
  }

  var scope = opts.scope;
  if(typeof scope === 'string') {
    if(Scopes[scope]) {
      scope = Scopes[scope];
    } else {
      scope = Scopes['Transient'];
    }
  } else if(typeof scope !== 'function') {
    scope = Scopes['Transient'];
  }

  this.store[name] = {
    factory: options.factory,
    scope: scope
  };

  return name;
};

proto.bindConstant = function(name, value) {
  this.store[name] = {
    value: value
  };
};

proto.invoke = function(thisObj, invokeTarget, locals) {
  if(typeof thisObj === 'function') {
    locals = invokeTarget || null;
    invokeTarget = thisObj;
    thisObj = null;
  }
  if(typeof invokeTarget !== 'function') {
    throw new Error('invokeTarget must be a function.');
  }
  locals = locals || {};
  var names = parse(invokeTarget);

  var container = this;
  container = new SimpleContainer(container);
  Object.keys(locals).forEach(function(name) {
    container.bindConstant(name, locals[name]);
  });

  return container.resolve(names).then(function(targetDeps) {
    return invokeTarget.apply(thisObj, targetDeps);
  });
};
