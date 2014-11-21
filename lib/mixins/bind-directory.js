var _ = require('lodash');
var Q = require('bluebird');
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
      if(prefix) {
        name = prefix + '/' + name;
      }

      plist.push(container.invoke(loadService, {
        container: container,
        servicePath: fullPath,
        name: name
      }));
    }
  });

  return Q.all(plist).then(function(results) {
    return _.chain(results).flatten().sortBy().valueOf();
  });
}

function loadService(container, servicePath, name) {
  var serviceCreator = require(servicePath);
  if(_.isFunction(serviceCreator)) {
    var opts = {
      factory: function() {
        return container.invoke(serviceCreator);
      }
    };
    // Bind service as Singleton
    // Unless they have been specified
    if(serviceCreator.$padma) {
      opts.factory.$padma = serviceCreator.$padma;
    } else {
      opts.scope = 'Singleton';
    }
    return container.bind(name, opts);
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
