var Q = require('q');
var Store = require('./store');

var SimpleContainer = module.exports.SimpleContainer =
  function (parentContainer) {
    this.parent = parentContainer;
    this.store = new Store(parentContainer && parentContainer.store);
  };

var proto = SimpleContainer.prototype;

proto.resolve = proto.get = function(name) {
  if(name instanceof Array) {
    var plist = [];
    var self = this;
    name.forEach(function(n) {
      plist.push(self.resolve(n));
    });

    return Q.all(plist);
  } else {
    var data = this.store[name];
    if(data) {
      return Q.resolve(data.value);
    }
  }

  return Q.reject(new Error("Can not resolve service by name '" + name + "'."));
};

proto.bindConstant = function(name, value) {
  this.store[name] = {
    value: value
  };
};

var getNames = function(fn){
  return fn.toString().match(/\((.*?)\)/)[1].match(/[\w]+/g) || [];
};

proto.invoke = function(invokeTarget, thisObj) {
  if(typeof invokeTarget !== 'function') {
    throw new Error('invokeTarget must be a function.');
  }
  var names = getNames(invokeTarget);

  return this.resolve(names).then(function(targetDeps) {
    return invokeTarget.apply(thisObj, targetDeps);
  });
};
