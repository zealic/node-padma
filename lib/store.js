module.exports = function (parent) {
  if(parent) {
    this.__proto__ = parent;
  } else {
    this.__proto__ = null;
  }
};
