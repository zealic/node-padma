var FUNC_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FUNC_ARG = /\/\*([^\*]*)\*\//m;

module.exports.parse = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Can not annotate "' + fn + '". Expected a function!');
  }

  var match = fn.toString().match(FUNC_ARGS);
  return match[1] && match[1].split(',').map(function(arg) {
    match = arg.match(FUNC_ARG);
    return match ? match[1].trim() : arg.trim();
  }) || [];
};
