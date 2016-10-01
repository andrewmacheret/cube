"use strict";

$.keys = function(obj) {
  var keys = [];
  $.each(obj, function(key) {
    keys.push(key);
  });
  return keys;
};

// Convert a function of the form
//   fn(optionsObject, callback)
// to a jquery promise
$.defer = function(fn, options) {
  var deferred = $.Deferred();
  fn(options, function(err, data) {
    if(err !== null) {
      return deferred.reject(err);
    }
    deferred.resolve(data);
  });
  return deferred.promise();   
};

$.getScripts = function() {
  var scripts = arguments;
  var promises = $.map(scripts, function(script) {
    return $.getScript(script);
  });
  return $.when.apply($, promises);
};
