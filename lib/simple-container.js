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

  Object.defineProperty(this, "store", {
    enumerable: false,
    value: new Store(parentContainer && parentContainer.store)
  });
};

var proto = SimpleContainer.prototype;

proto._resolveCore = function(name, throwError) {
  var self = this;

  if(name instanceof Array) {
    var plist = [];
    name.forEach(function(n) {
      plist.push(self._resolveCore(n, throwError));
    });

    return Q.all(plist);
  }

  var metadata = self.store[name];
  if(!metadata) {
    if(throwError) {
      return Q.reject(new Error('Can not find binding "' + name + '".'));
    }
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

    return Q.resolve(result);
  });
};

proto.resolve = function(name) {
  return this._resolveCore(name, true);
};

proto.get = proto.resolve;

proto.tryResolve = function(name) {
  return this._resolveCore(name).then(function(data) {
    var ret = {};
    if(name instanceof Array) {
      for(var i = 0; i < name.length; i++) {
        if(data[i] !== EMPTY) {
          ret[name[i]] = data[i];
        }
      }
    }
    else if(data !== EMPTY) {
      ret[name] = ret;
    }
    return ret;
  });
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

proto.invoke = function(invokeTarget, locals) {
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

  return container._resolveCore(names, true)
  .then(function(targetDeps) {
    return invokeTarget.apply(null, targetDeps);
  });
};
