/*
The files in this directory are part of $dlb_id_au$.keys, a javascript-based library.
Copyright (C) 2012-2013 Daniel Bush
This program is distributed under the terms of the GNU
General Public License.  A copy of the license should be
enclosed with this project in the file LICENSE.  If not
see <http://www.gnu.org/licenses/>.
*/

// Basic utilities
// - for representing key events
// - for doing key-bindings

// Textual key representation
// 
// - modifiers must be in capitals
// - valid modifiers are C, M, S (control,alt,shift)
// - must be in this order C-M-S
// - following the modifiers are the keys
// - keys can be alphanumeric or special key codes such
//   as UP, DOWN etc  See key codes used by key event adapter in ext/.
// - multi-keys aren't allowed
//   - eg C-a-b is invalid; use C-a followed by C-b

(function() {

  var gen_utils  = $dlb_id_au$.keys.gen_utils;
  var module = $dlb_id_au$.keys;
  module.bindings = {};

  (function() {

    module.keyCodes = {
      // These are modifiers and get special treatment.
      17:'CTRL',
      16:'SHIFT',
      18:'ALT',
      // Other special keys.
      9:'TAB',  // May be special case.
      27:'ESC',
      32:'SPC',
      13:'RET',
      8:'BACKSPACE',
      46:'DEL',
      37:'LEFT',
      38:'UP',
      39:'RIGHT',
      40:'DOWN',
      36:'HOME', 
      35:'END',
      33:'PGUP',
      34:'PGDOWN',
      112:'F1',
      113:'F2',
      114:'F3',
      115:'F4',
      116:'F5',
      117:'F6',
      118:'F7',
      119:'F8',
      120:'F9',
      121:'F10',
      122:'F11',
      123:'F12'
    };

    // Reverse special key lookup.

    module.keyCodesR = (function() {
      var h = {};
      for (var k in module.keyCodes) {
        h[module.keyCodes[k]]=k;
      }
      return h;
    })();

  })();

  // Take a browser event object and convert to a standardized key
  // event object.
  //
  // If you pass in `o` it will be used instead rather than creating a
  // new object.

  module.normalize = function(e,o) {

    if(!o) o={};

    o.altKey = e.altKey;
    o.shiftKey = e.shiftKey;
    o.ctrlKey = e.ctrlKey;
    o.keyCode = e.keyCode;

    // If this key event is to be treated as text, then
    // we should use o.chr.  o.charCode is first determined
    // from e (the native browser event)
    o.charCode = null;
    o.chr = null;

    // If we're printable text.
    o.isText = false;

    // Express that we're a key event.
    //
    // We need this if to distinguish ourselves from non-kb
    // events (in the event such events are send to the same
    // function).
    o.isKey = true;
    o.type = e.type;

    // String representation
    // - letters are always downcase whether shift is present or not
    // Examples:
    // - 'F1'
    // - 'SPC'
    // - 'C-c' / 'C-A-c' / 'C-A-S-c
    // - 'C-SPC'

    o.id = null;

    return o;
  };


  // Take a normalized key event and convert to a string
  // representation using names in keyCodes.

  module.textualize = function(evt) {
    var keyCodes = module.keyCodes;
    var str = '';
    if(evt.ctrlKey) str+='C-';
    if(evt.altKey) str+='M-';
    if(evt.shiftKey) str+='S-';
    if(evt.chr)
      str+=evt.chr.toLowerCase();
    else if(keyCodes[evt.keyCode])
      str+=keyCodes[evt.keyCode];
    else 
      str+=String.fromCharCode(evt.keyCode||evt.charCode).toLowerCase();
    return str;
  };

  (function(){

    // Normalize a textualized key.
    //
    // The textualizer already produces normalized keys.
    // The use for this is for user-textualized key bindings.
    // For instance we will rearrange C-M-S modifiers to
    // put them in the right order for hash lookup; and
    // we'll check that the user doesn't use multiple suffix
    // characters eg C-x-a
    // (which should be ['C-x','a']) etc.
    // 
    // Example:
    //   'UP' -> 'UP'
    //   'S-M-C-a' -> 'C-M-S-a'

    module.normalizeText = function(key){
      var parts = key.split('-');
      var prefix,suffix;
      var result;
      var p,s;

      result = extract_prefix(parts);
      prefix = result[0].sort();
      suffix = check_suffix(result[1]);
      p = join(prefix);
      s = join(suffix);
      if(p==='') return s;
      return p+'-'+s;
    }

    var join = function(parts) {
      var result = {str:''};
      gen_utils.join(parts,unsplit,process,result);
      return result.str;
    }
    var unsplit = function(o){o.str+='-';}
    var process = function(part,o){o.str+=part;}

    var extract_prefix = function(parts) {
      var prefix = [];
      var suffix = [];
      var isSuffix = false;
      var stop = false;
      gen_utils.each(parts,function(part){
        if(!stop) {
          switch(part){
          case 'S':
          case 'M':
          case 'C':
            prefix.push(part);
            break;
          default:
            suffix.push(part);
            stop = true;
            break;
          }
        } else {
          suffix.push(part);
        }
      });
      return [prefix,suffix];
    }

    var check_suffix = function(parts) {
      var count = 0;
      return gen_utils.map(parts,function(part){
        switch(part) {
        case 'S':
        case 'M':
        case 'C':
          throw new Error('Key binding contains modifier keys in wrong position.');
          break;
        case '':
          return '';
        default:
          if(/[a-z]/.test(part) && part.length>1) {
            throw new Error('Alphabetic characters should be lower case.');
          }
          count++;
          if(count>1) {
            throw new Error('When specifying keybindings you can only specify one key per array item.');
          }
          return part;
        }
      });
    }


  })();



  //------------------------------------------------------------
  // Bindings...


  // Make an input object that uses a lookup object to detect valid
  // sequences of key presses.
  //
  // Input is repeatedly invoked via the `input` method with one
  // textualized key event at a time.
  // 
  // It returns false if there is no chance of a valid keybinding.
  // It returns true if the key given can lead to more than one
  // keybinding.
  // If there is only one valid keybinding and key is the final key for
  // this binding, it returns the object associated with this binding.
  //
  // @see module.bindings.makeLookup for format.

  module.bindings.makeInput = function(lookup) {
    var current = lookup;
    return {
      reset:function() {
        current = lookup;
      },
      receive:function(key) {
        var c;
        current = current[key];
        if(!current) {
          current = lookup;
          return false;
        } else {
          if(current._key_hash) {
            // Key binding still valid but finished.
            return true;
          } else {
            // Key binding has been triggered.
            c = current;
            current = lookup;
            return c;
          }
        }
      }
    };
  };


  (function(){

    var map = gen_utils.map;
    var each = gen_utils.each;

    // Make a lookup hash for key combinations.
    //
    // Each key in a key combination is assumed to be a normalized
    // (textualized) key.
    // 
    // data =
    //   { someLabel:<bindings>,... }
    //   or
    //   [ <bindings>,... ] 
    // <bindings> = [[<binding>,...],func/obj]
    // <binding> = [text,....]  // Normalized keys eg ['C-x','C-c']

    module.bindings.makeLookup = function(data){
      var lookup = makeKeyHash();
      each(data,function(bindings){
        each(bindings,function(binding){
          module.bindings.addBinding(binding,lookup);
        });
      });
      return lookup;
    };
    
    // Add a key binding to an existing key lookup made by makeLookup.
    // 
    // <binding> = [[<keys>,...],func/obj]

    module.bindings.addBinding = function(binding,keyHash) {
      var keys,item;
      var p,k,l;
      var keysets = binding[0];
      each(keysets,function(keys) {
        item = binding[1];
        keys = map(keys,function(key){
          return module.normalizeText(key);
        });
        l = keyHash;
        each(keys,function(key,index){
          var last = (keys.length-1 === index);
          p = l; k = key;

          // If key is already used and it is flagged as last:
          if(l[key] && check_last_key(l,key)) {
            if(last) {
              // If we're also last, then it is a duplicate key.
              throw new Error(errors.C + ': ' + printKey(keys));
            } else {
              throw new Error(errors.A + ': ' + printKey(keys));
            }
          }
          // If key is already used and we're the last key but it isn't
          if(l[key] && last && !check_last_key(l,key)) {
            throw new Error(errors.B + ': ' + printKey(keys));
          }

          l[key] = l[key] || makeKeyHash();

          l = l[key];
        });
        p[k] = item;
        p._last_keys = p._last_keys || {};
        p._last_keys[k] = true;
      });
    };

    // Check the last_key hash of a given key hash.

    var check_last_key = function(key_hash,key) {
      var l;
      if(l=key_hash._last_keys) {
        return l[key];
      } else {
        return false;
      }
    };

    var errors = {
      A:'Key being added makes an existing one a prefix',
      B:'Key being added is a prefix of an existing one',
      C:'Key duplicates another',
    };
    var printKey = function(keys){
      return keys.join(' ');
    };

    var makeKeyHash = function(){
      var h = {};
      h._key_hash = true;
      return h;
    };


  })();

  return module;

})();
