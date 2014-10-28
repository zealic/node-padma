var Q = require('q');
var parse = require('./annotation').parse;
var Store = require('./store');
var Scopes = require('./scopes');

var EMPTY = Object.create(null);

var SimpleContainer = module.exports = function (parentContainer) {
  this.parent = parentContainer;
  this.store = new Store(parentContainer && parentContainer.store);
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

proto.resolve = proto.get = function(name) {
  if(name instanceof Array) {
    var plist = [];
    var self = this;
    name.forEach(function(n) {
      plist.push(self.resolve(n));
    });

    return Q.all(plist);
  } else {
    return resolveCore(this, name).then(function(ret) {
      if(ret === EMPTY) {
        return Q.reject(new Error('Can not find binding "' + name + '".'));
      }
      return ret;
    });
  }

  return Q.reject(new Error("Can not resolve service by name '" + name + "'."));
};

function merge(dest, source) {
  for (var property in source) {
    dest[property] = source[property];
  }
  return dest;
}

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
        merge(ret, dep);
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

  var scope = options.scope;
  if(typeof scope === 'string') {
    if(Scopes[scope]) {
      scope = Scopes[scope];
    } else {
      scope = Scopes['Transient'];
    }
  } else if(typeof scope !== 'function') {
    scope = Scopes['Transient'];
  }

  if(options.factory) {
    if(typeof options.factory !== 'function') {
      throw new Error('options.factory must be a function.');
    }
    this.store[name] = {
      factory: options.factory,
      scope: scope
    };
  } else if(options.value) {
    this.bindConstant(name, options.value);
  }
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
  var names = parse(invokeTarget);

  var container = this;
  if(locals) {
    container = new SimpleContainer(container);
    Object.keys(locals).forEach(function(name) {
      container.bindConstant(name, locals[name]);
    });
  }
  return container.resolve(names).then(function(targetDeps) {
    return invokeTarget.apply(thisObj, targetDeps);
  });
};
