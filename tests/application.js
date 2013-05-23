
var data = $dlb_id_au$.unitJS.data;
var with_tests$ = $dlb_id_au$.unitJS.with$.with_tests$;
var with_tests = $dlb_id_au$.unitJS.with$.with_tests;
var run = $dlb_id_au$.unitJS.run.run;
var print = $dlb_id_au$.unitJS.print.print;


// Run tests:
window.onload = function() {

  var div,results;
  var tests

  div = document.getElementById('container');
  if(!div) {
    console.log("Can't find div#container.");
    return;
  }

  tests = with_tests('utilities',function(M){
    M.tests('key-bindings',function(M){
      M.test('normalize keys for use with binding hash',function(){
        var errors;
        var result;
        var keys = $dlb_id_au$.keys;
        var bindings = $dlb_id_au$.keys.bindings;

        this.assertEquals('C-M-S-a',keys.normalizeText('C-M-S-a'));
        this.assertEquals('modifiers are sorted',
                          'C-M-S-a',keys.normalizeText('M-C-S-a'));
        this.assertEquals('hypen as key',
                          'C-M-S--',keys.normalizeText('C-M-S--'));
        this.assertEquals('hypen as key and modifiers sorted',
                          'C-M-S--',keys.normalizeText('M-C-S--'));

        try {
          errors = false;
          keys.normalizeText('M-C-S-a-b')
        } catch(e) {
          errors = true;
        }
        this.assertEquals('multiple (non-modifier) keys should fail',
                          true,errors);

        this.assertEquals('multiple hyphen keys',
                          'C-M-S---',keys.normalizeText('C-M-S---'));
        
        try {
          errors = false;
          keys.normalizeText('M-C-S-ab');
        } catch(e) {
          errors = true;
        }
        this.assertEquals('Error should have been thrown',true,errors);

        this.assertEquals('special key codes',
                          'C-M-UP',keys.normalizeText('M-C-UP'));

        this.assertEquals('single keys',
                          'UP',keys.normalizeText('UP'));
      });

      M.test('adding keybindings',function(){
        var bindings = $dlb_id_au$.keys.bindings;
        var lookup;
        var data,data2,data3;
        var was_error = function(fn) {
          var errors = false;
          try {
            fn();
          } catch(e) {
            console.log(e.message);
            errors = true;
          }
          return errors;
        }

        data = {
          group1:{
            label1:[[['C-1','a']],{item:1}],
            label2:[[['C-2','b']],{item:2}]
          },
          group2:{
            label1:[[['C-3','c']],{item:3}],
            label2:[[['C-4','d']],{item:4}]
          }
        };
        lookup = bindings.makeLookup(data);
        this.assertEquals(data.group1.label1[1],lookup['C-1']['a']);

        data = {
          group1:{
            label1:[[['C-1','a']],{item:1}],
            label2:[[['C-1','b']],{item:1}]
          }
        };
        lookup = bindings.makeLookup(data);
        this.assertEquals('shared prefix is valid (1)',
          data.group1.label1[1],lookup['C-1']['a']);

        data = {
          group1:{
            label1:[[['C-1','C-2','a']],{item:1}],
            label2:[[['C-1','C-2','b']],{item:1}]
          }
        };
        lookup = bindings.makeLookup(data);
        this.assertEquals('shared prefix is valid (2)',
          data.group1.label1[1],lookup['C-1']['C-2']['a']);
        this.assertEquals('shared prefix is valid (2a)',
          data.group1.label2[1],lookup['C-1']['C-2']['b']);



        data = {
          group1:{
            label1:[[['C-1','a']],{item:1}],
            label2:[[['C-1','a']],{item:1}], // same binding (invalid)
          }
        };
        this.assertEquals('Should fail if same binding',true,
          was_error(function(){
            lookup = bindings.makeLookup(data);
          }));



        data = {
          group1:{
            label1:[[['C-1','a']],{item:1}],
            label2:[[['C-1','a','b']],{item:1}], // reused prefix (invalid)
          }
        };
        data2 = {
          // Same as previous data but we put prefixed key
          // *after* the longer one.  It's a hash so changing
          // order might not change anything but in firefox it
          // does change and this can be tested for.
          group1:{
            label2:[[['C-1','a','b']],{item:1}], // reused prefix (invalid)
            label1:[[['C-1','a']],{item:1}],
          }
        };
        data3 = {
          group1:{
            label1:[[['C-1','a']],{item:1}]
          },
          group2:{
            label2:[[['C-1','a','b']],{item:1}], // reused prefix (invalid)
          }
        }
        this.assertEquals('Duplicated key bindings should fail.',true,
          was_error(function(){
            lookup = bindings.makeLookup(data);
          }));
        this.assertEquals('Duplicated key bindings should fail.',true,
          was_error(function(){
            lookup = bindings.makeLookup(data2);
          }));
        this.assertEquals('Duplicated key bindings should fail.',true,
          was_error(function(){
            lookup = bindings.makeLookup(data3);
          }));
      });


      M.test('retrieving keybindings (input)',function(){
        var bindings = $dlb_id_au$.keys.bindings;
        var lookup;
        var data;
        var result;

        data = {
          group1:{
            label1:[[['C-1','a']],{item:1}],
            label2:[[['C-2','b']],{item:2}]
          },
          group2:{
            label1:[[['C-3','c']],{item:3}],
            label2:[[['C-4','d']],{item:4}]
          }
        };
        lookup = bindings.makeLookup(data);
        input = bindings.makeInput(lookup);

        this.assertEquals(
          'returns true with valid prefix',
          true,input.receive('C-1'));
        this.assertEquals(
          'triggers valid keybinding',
          1,input.receive('a').item);

        input.reset();

        input.receive('C-1');
        this.assertEquals(
          'resets if invalid prefix - part A',
          false,input.receive('b'));
        input.receive('C-1');
        this.assertEquals(
          'resets if invalid prefix - part B',
          1,input.receive('a').item);
      });
    });
  });

  results = print(tests);
  div.appendChild(results.node);

};

