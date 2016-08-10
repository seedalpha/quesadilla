var path   = require('path');
var fs     = require('fs');
var url    = require('url');
var crypto = require('crypto');
var mime   = require('mime');
var debug  = require('debug')('quesadilla');
var sass   = require('node-sass');
var filewatcher = require('filewatcher');
var EventEmitter = require('events').EventEmitter;

exports = module.exports = function quesadilla(options) {
  
  if (typeof options === 'string') {
    options = { src: options };
  }
  
  var cache = {};
  var bundles = {};
  var generating = {};
  var emitter = new EventEmitter();
  
  return function(req, res, next) {
    var reqPath = req.path || url.parse(req.url).path;
    
    function notFound() {
      if (typeof next === 'function') {
          return next();
      }

      res.setHeader('Content-Type', 'text/plain');
      res.writeHeader(404);
      res.end('Not Found');
    }
    
    function respond(err, source) {
      if (err) {
        if (typeof next === 'function') {
          return next(err);
        }

        res.setHeader('Content-Type', 'text/plain');
        res.writeHeader(500);
        res.end(err.toString());
        return;
      }
      
      res.setHeader('Content-Type', 'text/css');

      var etag = crypto.createHash('md5').update(source).digest('hex').slice(0, 6);
      
      if (req.get && (etag === req.get('If-None-Match'))) {
        res.writeHeader(304);
        res.end();
      } else {
        res.setHeader('ETag', etag);
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Length', source.length);
        res.writeHeader(200);
        res.end(source);
      }
    }
    
    function safeGenerate(file, callback) {
      emitter.once(file, callback);
      if (!generating[file]) {
        generating[file] = true;
        debug('bundling %s', file);
        generate(file, function(error, source) {
          delete generating[file];
          if (error) {
            debug("error building %s from %s: %s", reqPath, file, error);
          } else {
            debug("built %s from %s", reqPath, file);
          }
          emitter.emit(file, error, source);
        });
      }
    }
    
    function generate(file, callback) {
      var result;
      
      try {
        var params = { file: file };
        for (var key in options) {
          params[key] = options[key];
        }
        result = sass.renderSync(params);
      } catch (e) {
        
        if (!options.cache) {
          watchFiles(file, [], reqPath);
        }
        
        return callback(e, '');
      }
      
      if (!options.cache) {
        watchFiles(file, result.stats.includedFiles, reqPath);
      }
      
      cache[reqPath] = result.css;
      callback(null, result.css);
    }
    
    function watchFiles(main, list, cacheKey) {
      var watcher = filewatcher();
      watcher.once('change', function(file) {
        debug("rebuilding %s due to change in %s", cacheKey, file);
        watcher.removeAll();
        delete cache[cacheKey];
        safeGenerate(main, function(error) {
          if (error) {
            debug('Error watching', error, cacheKey);
          }
        });
      });
      watcher.once('fallback', function(limit) {
        debug('Ran out of file handles after watching %s files.', limit);
        debug('Falling back to polling which uses more CPU.');
        debug('Run ulimit -n 10000 to increase the limit for open files.');
      });
      
      watcher.add(main);
      
      list.forEach(function(filename) {
        watcher.add(filename);
      });
    }
    
    if (!path.extname(reqPath)) {
        return notFound();
    } else if (mime.lookup(reqPath) !== 'text/css') {
        return notFound();
    }
    
    if (cache[reqPath]) {
      return respond(null, cache[reqPath]);
    }
    
    var local = path.normalize(path.join(options.src, reqPath));

    if (local.indexOf(options.src) !== 0) {
      return notFound();
    }
    
    // rename .css to .scss
    var parts = local.split('.');
    parts.pop();
    parts.push('scss');
    local = parts.join('.');
    
    fs.exists(local, function(exists) {
      if (!exists) {
        return notFound();
      }
      safeGenerate(local, respond);
    });
    
  }
}