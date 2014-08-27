var Q = require('q');
var Store = require('./store');

var SimpleContainer = module.exports.SimpleContainer =
  function (parentContainer) {
    this.parent = parentContainer;
    this.store = new Store(parentContainer && parentContainer.store);
  };

var proto = SimpleContainer.prototype;

proto.resolve = proto.get = function(name) {
  var data = this.store[name];

  if(data) {
    return Q.resolve(data.value);
  }
  return Q.reject(new Error("Can not resolve service by name '" + name + "'."));
};

proto.bindConstant = function(name, value) {
  this.store[name] = {
    value: value
  };
};
