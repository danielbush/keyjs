
$dlb_id_au$.keys ("keys.js")
============================

What?
-----

A basic key library for handling keyboard events.

Features
--------

* controller
  * can be enabled/disabled
  * attached to document
  * you register a function with it to receive normalized key events
* keybindings
  * including sequences of bindings such as C-x C-f (a la emacs)
  * uses a trie-like object that can reset itself if the binding turns out to be non-existent
* hysteresis
  * double ESC will disable the controller
* utilities
  * codes and text representations for representing keys

Check it out
-------------
* Go to tests/live/index.html
* Bring up console.log and test.

TODO / ISSUES
-------------

This was written sometime ago.
It works well in firefox and chrome.
I haven't tested on safari or IE for a long time.
Also dom3 key event handling hasn't been implemented yet.
This library still does a pretty good job just using keydown and keypress events.
