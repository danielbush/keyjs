/*
The files in this directory are part of $dlb_id_au$.keys, a javascript-based library.
Copyright (C) 2012-2013 Daniel Bush
This program is distributed under the terms of the GNU
General Public License.  A copy of the license should be
enclosed with this project in the file LICENSE.  If not
see <http://www.gnu.org/licenses/>.
*/

// Really basic utilities
// - based on code from $dlb_id_au$.utils . 

$dlb_id_au$.keys.gen_utils = function() {

  var module = {};

  // Transform `thing` using `fn`.
  //
  // If `fn` not provided, `map` will act like
  // a shallow clone, creating a copy of the object
  // but using the same members as the original.

  module.map = function(thing,fn) {
    var m;
    if(thing.length) {
      m = [];
      module.each(thing,function(n,key){
        if(fn) {
          m.push(fn(n,key));
        } else {
          m.push(n);
        }
      });
      return m;
    }
    else if(typeof(thing)=='object') {
      m = {};
      module.each(thing,function(n,key){
        if(fn) {
          m[key] = fn(n,key);
        } else {
          m[key] = n;
        }
      });
      return m;
    }
  };

  // Iterate through array or object.

  module.each = function(thing,fn) {
    // thing.length handles 'arguments' object.
    if(thing.length) {
      for(var i=0;i<thing.length;i++) {
        fn(thing[i],i);
      }
    }
    else if(typeof(thing) == 'object') {
      for(var n in thing) {
        if(thing.hasOwnProperty(n)) {
          fn(thing[n],n);
        }
      }
    }
  };
  // Join elements in arr where arr is result of
  // String.prototype.split.
  // 
  // `unsplit`: will be run on every empty gap in the array
  //            including before and after
  // `process`: is called only for non-blank gaps
  // `o`      : is an optional object you can pass in which will be
  //            passed on to `unsplit` and `process`

  module.join = function(arr,unsplit,process,o) {
    var i,l=arr.length;
    for(i=0;i<l;i++) {
      if(arr[i]!=='') process(arr[i],o);
      //process(arr[i],o);
      if(i!=l-1) unsplit(o);
    }
    return o;
  };
  return module;
}();
