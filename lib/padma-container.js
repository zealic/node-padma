var inherits = require('util').inherits;
var SimpleContainer = require('./simple-container');

var PadmaContainer = module.exports = function (container) {
  SimpleContainer.call(this, container);
};

var proto = PadmaContainer.prototype;
inherits(PadmaContainer, SimpleContainer);

require('./mixins');
