/*
The files in this directory are part of $dlb_id_au$.keys, a javascript-based library.
Copyright (C) 2012-2013 Daniel Bush
This program is distributed under the terms of the GNU
General Public License.  A copy of the license should be
enclosed with this project in the file LICENSE.  If not
see <http://www.gnu.org/licenses/>.
*/

// Key controller.
//
// This is module acts as a singleton object.
// Grab it like this:
//   var controller = $dlb_id_au$.keys.controller;
// Then use:
//   controller.register(fn);
//   => fn(kevt) where kevt is a normalized key object
// 
// How it works:
// - we attach event listeners to keydown and keypress events
// - we ignore so called "naked modifier" events
//   - these are events emitted by the browser for single
//     presses of ctrl, alt, shift
// - keydown is used to take care of
//   - special keys - arrows, f-keys etc
//   - any key press using ctrl and/or alt
// - keypress is used to take care of text input
// - an emacs-like key binding may involve both
//   keydown and keypress eg
//   for "C-x b", "C-x" will come from keydown and
//   "b" will come from keypress

$dlb_id_au$.keys.controller = function() {

  var module   = {};

  var keys       = $dlb_id_au$.keys;
  var keyCodes   = $dlb_id_au$.keys.keyCodes;
  var textualize = $dlb_id_au$.keys.textualize;

  var browser  = {
    safari:(navigator.vendor &&
            navigator.vendor.indexOf('Apple')!=-1)
  };


  // Turn this on to log everything to console.log.
  module.DEBUG = false;
  // Reusable normalised event object.
  module.evt = {};
  module.hysteresis = 250; //ms

  // Represents the dom node we attach to;
  // for firefox/chrome/safari 'document' works well
  var NODE = null;
  var RECEIVER = null;
  var DISABLED = false;
  var ATTACHED = false;


  //-----------------------------------------------------------
  // Register


  // Set the function that will receive all key events.

  module.register = function(fn) {
    RECEIVER = fn;
  };

  //-----------------------------------------------------------
  // Enable / disable

  // Don't detach controller but go into quiet mode.

  module.disable = function() {
    DISABLED = true;
  };

  module.enable = function() {
    DISABLED = false;
  };

  //------------------------------------------------------------
  // Attach / detach

  (function() {

    // Attach controller to document.body.
    
    module.attach = function() {
      ready(function() {
        module.DEBUG && console.log('attaching...');
        //NODE = document.body; // doesn't work
        NODE = document;
        addEventHandler(NODE,'keydown',module.keydown);
        addEventHandler(NODE,'keypress',module.keypress);
        ATTACHED = true;
      });
    };

    // Permanently remove controller from listening to key events.

    module.detach = function() {
      module.DEBUG && console.log('detaching...');
      ATTACHED = false;
      if(NODE) {
        removeEventHandler(NODE,'keydown',module.keydown);
        removeEventHandler(NODE,'keypress',module.keypress);
      }
    };

    // Keep checking if document.body is available.
    // If it is, append document fragment in 'body'
    // to document.body and update 'body'.

    var ready = function(f) {
      var id;
      var tries=0;
      var interval=100; //ms
      var fail_after=10000; //ms
      var check_body = function() {
        module.DEBUG && console.log('checking for body...');
        f();
        if(document.body) {
          window.clearInterval(id);
        }
        if(interval*tries>fail_after) {
          window.clearInterval(id);
        }
        tries++;
      }
      id = window.setInterval(check_body,interval);
    };


  })();




  //----------------------------------------------------------
  // keydown / keypress handler


  // Note: some special key codes are reused as charcodes. The
  // printable character '#' uses the special key code for 'end'. But
  // the *actual* keycode for shift-3 is 51 ('3'), because we use the
  // ascii code of the key as its keycode(!)
  // 
  // Combine this with the following (subject to changes in browser
  // versions):
  // - Opera9x/IE6 only use keycodes in their events.
  // - IE(6) selectively suppresses keypress but not opera
  // - FF3 uses either keycode or charcode but usually not both
  //   in the same event (keydown/keypress).
  // - Safari 3.0x uses both in both keydown/keypress.

  (function(){

    // Store the keycode from keydown.
    var keyDownKeyCode = null;
    var previous_keycode = null;
    // Like previous_keycode but used by keypress.
    var previous_keycode2 = null;

    module.keydown = function(e) {

      var prev_keycode;
      e = e || window.event;

      module.DEBUG && console.log('----------START----------');
      module.DEBUG && console.log('[keydown] keycode:',e.keyCode,' charcode:',e.charCode,' char(DOM3):',e['char'],' key(DOM3)',e.key);

      prev_keycode = previous_keycode;
      previous_keycode2 = prev_keycode; // yes, that's right
      previous_keycode = e.keyCode;

      keyDownKeyCode = null;
      //e = e || window.event;

      // Ignore naked modifier events.

      switch(e.keyCode) {
      case 16:
      case 17:
      case 18:
        start_hysteresis(1);
        return null;
      case 224:
        // Firefox 3.0.5; pressing ctrl+alt+shift sometimes
        // generates this.
        return null;
      default: break;
      }

      // Look for double-escape hysteresis...
      if(apply_escape_hysteresis(e,prev_keycode)) return;

      if(DISABLED) return;

      // "If key is not a special key and only shift modifier is
      // (potentially) used..."

      if (!e.altKey && !e.ctrlKey) {
        if(!keyCodes[e.keyCode]) {
          return null;
        }
      }

      keyDownKeyCode = e.keyCode;
      keys.normalize(e,module.evt)
      apply_modifier_hysteresis(module.evt,prev_keycode); 

      if(RECEIVER) RECEIVER(module.evt);
      module.DEBUG && console.log('[keydown/receive] normalized:');
      module.DEBUG && console.log(module.evt);
      module.DEBUG && console.log('...textualized:'+textualize(module.evt));
      return preventDefault(e);
    }

    module.keypress = function(e) {
      if(DISABLED) return;
      module.DEBUG && console.log('[keypress] keycode:',e.keyCode,' charcode:',e.charCode);

      var charCode;
      var keyDownKeyCode$ = keyDownKeyCode;
      var prev_keycode = previous_keycode2;

      previous_keycode2 = null;
      keyDownKeyCode = null;

      e = e || window.event;


      if(e.altKey||e.ctrlKey) return null;

      // Firefox generates keypress for keys like F1 
      // which use 'p' ascii code  for its keycode.
      if(e.charCode==0) return null;  

      // IE/Opera only uses keyCode.
      charCode = e.charCode || e.keyCode;  

      // Opera - all versions; "f2/q or f6/u problem"
      // - ie6 isn't so much affected because it doesn't
      //   generate keypress for f2/f6

      if(e.keyCode==keyDownKeyCode$) {
        return null;
      }


      // Ignore anything in keys.keyCodes...
      //if(keys.keyCodes[e.keyCode] && !e.charCode) return null;

      // Safari 3.0x
      if(browser.safari && e.charCode!=e.keyCode) return null; 

      switch(e.charCode) {
      case 32:
        // Firefox produces 32,0 and 0,32 for keydown and
        // keypress.
        return null;
      }

      // Opera 9.26 - shift key (keyCode=16) is 
      // passed as separate keypress event:
      if(e.keyCode) {
        switch(e.keyCode) {
        case 16:
        case 17:
        case 18:
          return null;
        case 27:
          // safari 3 sets both keycode and charcode for
          // this
        case 9:
          // Treat tabs like special key only (keydown);
          // safari 3 and opera will both generate tabs here
          // if we don't detect it
          return null;
        default: break;
        }
      }


      keys.normalize(e,module.evt)
      module.evt.isText = true;
      module.evt.charCode = charCode;
      module.evt.chr = String.fromCharCode(charCode);

      // Look for modifier key hysteresis
      //
      // This means looking for a previous keydown event
      // that had a keycode for ctrl,alt or shift...

      apply_modifier_hysteresis(module.evt,prev_keycode); 

      if(RECEIVER) RECEIVER(module.evt);
      module.DEBUG && console.log('[keypress/receive] normalized:');
      module.DEBUG && console.log(module.evt);
      module.DEBUG && console.log('...textualized:'+textualize(module.evt));
      return preventDefault(e);
    }

  })();



  //----------------------------------------------------------
  // Temporal Hysteresis
  // 
  // Note:
  // - If an hysteresis of a different type is already started
  //   then we don't start a new hysteresis

  var start_hysteresis,stop_hysteresis;
  var apply_modifier_hysteresis,apply_escape_hysteresis;

  (function(){

    var hysteresis_type = null;
    var hysteresis = false;
    var hysteresis_id = {0:null,1:null};
    // 0 = double-escape hysteresis (for enable/disable)
    // 1 = modifier-key hysteresis

    start_hysteresis = function(htype) {
      module.DEBUG && console.log('starting hysteresis');
      if(hysteresis) {
        if(hysteresis_type === null) {}
        else if(hysteresis_type != htype) return;
        module.DEBUG && console.log('clearing stale hysteresis');
        window.clearTimeout(hysteresis_id[htype]);
      }
      hysteresis_type = htype;
      hysteresis = true;
      hysteresis_id[htype] =
        window.setTimeout(stop_hysteresis,module.hysteresis);
    };

    stop_hysteresis = function() {
      module.DEBUG && console.log('stopping hysteresis');
      hysteresis_type = null;
      hysteresis = false;
    };

    // Apply shift/ctrl/alt modifier to another key if
    // temporal hysteresis applies.
    //
    // This will allow things like A-x or A-<anything>
    // in opera and it will not trigger native events
    // like C-f (atm I can't prevent these native
    // functions from triggering).
    // 
    // This only works for a single modifier eg A-x
    // not several (C-A-x).
    // Note that opera will often work find for something
    // like C-A-f.

    apply_modifier_hysteresis = function(evt,prev_keycode) {
      if(hysteresis && hysteresis_type === 1) {
        module.DEBUG && console.log('applying modifier hysteresis');
        switch(prev_keycode) {
        case 16: evt.shiftKey = true; break;
        case 17: evt.ctrlKey = true; break;
        case 18: evt.altKey = true; break;
        }
      }
    };

    // Look for Esc-Esc and toggle enable/disable of controller
    //
    // Returns true if applicable.

    apply_escape_hysteresis = function(e,prev_keycode) {
      if(e.keyCode == 27) {
        if(prev_keycode == 27) {
          if(hysteresis && hysteresis_type === 0) {
            module.DEBUG && console.log('applying double-escape hysteresis');
            if(DISABLED) module.enable();
            else module.disable();
            return true;
          } else start_hysteresis(0);
        } else start_hysteresis(0);
      }
      return false;
    };

  })();


  //------------------------------------------------------------
  // Miscellaneous...




  // Add event handler to a DOM node.
  // Assumes bubble phase only (bubbling up from the target).

  var addEventHandler = function(node,type,func) {
    if(node.addEventListener){
      node.addEventListener(type,func,false);
    } else {
      node.attachEvent('on'+type,func);
    }
  };

  var removeEventHandler = function(node,type,func) {
    if(node.removeEventListener){
      node.removeEventListener(type,func,false);
    } else {
      node.detachEvent('on'+type,func);
    }
  };

  var preventDefault = function(e) {
    module.DEBUG && console.log('Calling preventDefault');
    if(e.preventDefault) e.preventDefault();
    e.returnValue = false;
    return false;
  };

  return module;

}();

