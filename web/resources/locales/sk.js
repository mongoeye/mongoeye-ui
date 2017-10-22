Globalize.locale("sk");
(function( root, factory ) {

	// UMD returnExports
	if ( typeof define === "function" && define.amd ) {

		// AMD
		define( ["globalize-runtime/plural","globalize-runtime/message"], factory );
	} else if ( typeof exports === "object" ) {

		// Node, CommonJS
		module.exports = factory( require("globalize/dist/globalize-runtime/plural"), require("globalize/dist/globalize-runtime/message") );
	} else {

		// Global
		factory( root.Globalize );
	}
}( this, function( Globalize ) {

var validateParameterTypeNumber = Globalize._validateParameterTypeNumber;
var validateParameterPresence = Globalize._validateParameterPresence;
var pluralGeneratorFn = Globalize._pluralGeneratorFn;
var validateParameterTypeMessageVariables = Globalize._validateParameterTypeMessageVariables;
var messageFormat = Globalize._messageFormat;
var messageFormatterFn = Globalize._messageFormatterFn;

Globalize.a2060383687 = pluralGeneratorFn(function(n
/*``*/) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1];
  return (n == 1 && v0) ? 'one'
      : ((i >= 2 && i <= 4) && v0) ? 'few'
      : (!v0) ? 'many'
      : 'other';
});
Globalize.a1196372550 = messageFormatterFn((function(  ) {
  return function (d) { return "Došlo k chybe spojenia. Skontrolujte prosím svoje pripojenie k internetu a skúste to znova."; }
})(), Globalize("sk").pluralGenerator({}));
Globalize.a928528120 = messageFormatterFn((function(  ) {
  return function (d) { return "Došlo k chybe pri spracovaní vašej požiadavky. Skúste prosím neskôr."; }
})(), Globalize("sk").pluralGenerator({}));

return Globalize;

}));
