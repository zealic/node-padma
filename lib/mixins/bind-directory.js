var _ = require('lodash');
var Q = require('q');
var fs = require('fs');
var path = require('path');

var PadmaContainer = require('../padma-container');

var proto = PadmaContainer.prototype;

// Load services
function loadServices(container, basedir, prefix) {
  var plist = [];
  basedir = path.normalize(basedir);
  if(!fs.existsSync(basedir)) { return Q.resolve(null); }

  fs.readdirSync(basedir).forEach(function (file) {
    var fullPath = basedir + '/' + file;
    if(fs.statSync(fullPath).isDirectory()) {
      plist.push(container.invoke(loadServices, {
        container: container,
        basedir: fullPath,
        prefix: prefix ? prefix + '/' + file : file
      }));
    } else if(file.substr(-3) === '.js') {
      var name = file.substr(0, file.length - 3);
      // Pass starts with '_'
      if(name.indexOf('_') === 0) { return; }
      var scope = 'Singleton';
      if(name.indexOf('$') === 0) {
        name = name.substr(1, name.length - 1);
        scope = 'Transient';
      }
      if(prefix) {
        name = prefix + '/' + name;
      }

      plist.push(container.invoke(loadService, {
        container: container,
        servicePath: fullPath,
        name: name,
        scope: scope
      }));
    }
  });

  return Q.all(plist);
}

function loadService(container, servicePath, name, scope) {
  var serviceCreator = require(servicePath);
  if(_.isFunction(serviceCreator)) {
    return container.bind(name, {
      scope: scope,
      factory: function() {
        return container.invoke(serviceCreator);
      }
    });
  }
  throw new Error('Not supported service "' + servicePath + '".');
}

proto.bindDirectory = function(dir) {
  return this.invoke(loadServices, {
    container: this,
    basedir: dir,
    prefix: null
  });
};
