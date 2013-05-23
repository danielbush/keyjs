
var controller    = $dlb_id_au$.keys.controller;
var textualize    = $dlb_id_au$.keys.textualize;
controller.DEBUG=true;
controller.attach();
controller.register(function(kevt){
  console.log("I got: "+textualize(kevt));
});

