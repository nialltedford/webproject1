/*!
* jQuery Validation Plugin v1.14.0
*
* http://jqueryvalidation.org/
*
* Copyright (c) 2015 Jörn Zaefferer
* Released under the MIT license
*/
(function( factory ) {
if ( typeof define === "function" && define.amd ) {
define( ["jquery"], factory );
} else {
factory( jQuery );
}
}(function( $ ) {



$.extend($.fn, {
// http://jqueryvalidation.org/validate/
validate: function( options ) {



// if nothing is selected, return nothing; can't chain anyway
if ( !this.length ) {
if ( options && options.debug && window.console ) {
console.warn( "Nothing selected, can't validate, returning nothing." );
}
return;
}



// check if a validator for this form was already created
var validator = $.data( this[ 0 ], "validator" );
if ( validator ) {
return validator;
}



// Add novalidate tag if HTML5.
this.attr( "novalidate", "novalidate" );



validator = new $.validator( options, this[ 0 ] );
$.data( this[ 0 ], "validator", validator );



if ( validator.settings.onsubmit ) {



this.on( "click.validate", ":submit", function( event ) {
if ( validator.settings.submitHandler ) {
validator.submitButton = event.target;
}



// allow suppressing validation by adding a cancel class to the submit button
if ( $( this ).hasClass( "cancel" ) ) {
validator.cancelSubmit = true;
}



// allow suppressing validation by adding the html5 formnovalidate attribute to the submit button
if ( $( this ).attr( "formnovalidate" ) !== undefined ) {
validator.cancelSubmit = true;
}
});



// validate the form on submit
this.on( "submit.validate", function( event ) {
if ( validator.settings.debug ) {
// prevent form submit to be able to see console output
event.preventDefault();
}
function handle() {
var hidden, result;
if ( validator.settings.submitHandler ) {
if ( validator.submitButton ) {
// insert a hidden input as a replacement for the missing submit button
hidden = $( "<input type='hidden'/>" )
.attr( "name", validator.submitButton.name )
.val( $( validator.submitButton ).val() )
.appendTo( validator.currentForm );
}
result = validator.settings.submitHandler.call( validator, validator.currentForm, event );
if ( validator.submitButton ) {
// and clean up afterwards; thanks to no-block-scope, hidden can be referenced
hidden.remove();
}
if ( result !== undefined ) {
return result;
}
return false;
}
return true;
}



// prevent submit for invalid forms or custom submit handlers
if ( validator.cancelSubmit ) {
validator.cancelSubmit = false;
return handle();
}
if ( validator.form() ) {
if ( validator.pendingRequest ) {
validator.formSubmitted = true;
return false;
}
return handle();
} else {
validator.focusInvalid();
return false;
}
});
}



return validator;
},
// http://jqueryvalidation.org/valid/
valid: function() {
var valid, validator, errorList;



if ( $( this[ 0 ] ).is( "form" ) ) {
valid = this.validate().form();
} else {
errorList = [];
valid = true;
validator = $( this[ 0 ].form ).validate();
this.each( function() {
valid = validator.element( this ) && valid;
errorList = errorList.concat( validator.errorList );
});
validator.errorList = errorList;
}
return valid;
},



// http://jqueryvalidation.org/rules/
rules: function( command, argument ) {
var element = this[ 0 ],
settings, staticRules, existingRules, data, param, filtered;



if ( command ) {
settings = $.data( element.form, "validator" ).settings;
staticRules = settings.rules;
existingRules = $.validator.staticRules( element );
switch ( command ) {
case "add":
$.extend( existingRules, $.validator.normalizeRule( argument ) );
// remove messages from rules, but allow them to be set separately
delete existingRules.messages;
staticRules[ element.name ] = existingRules;
if ( argument.messages ) {
settings.messages[ element.name ] = $.extend( settings.messages[ element.name ], argument.messages );
}
break;
case "remove":
if ( !argument ) {
delete staticRules[ element.name ];
return existingRules;
}
filtered = {};
$.each( argument.split( /\s/ ), function( index, method ) {
filtered[ method ] = existingRules[ method ];
delete existingRules[ method ];
if ( method === "required" ) {
$( element ).removeAttr( "aria-required" );
}
});
return filtered;
}
}



data = $.validator.normalizeRules(
$.extend(
{},
$.validator.classRules( element ),
$.validator.attributeRules( element ),
$.validator.dataRules( element ),
$.validator.staticRules( element )
), element );



// make sure required is at front
if ( data.required ) {
param = data.required;
delete data.required;
data = $.extend( { required: param }, data );
$( element ).attr( "aria-required", "true" );
}



// make sure remote is at back
if ( data.remote ) {
param = data.remote;
delete data.remote;
data = $.extend( data, { remote: param });
}



return data;
}
});



// Custom selectors
$.extend( $.expr[ ":" ], {
// http://jqueryvalidation.org/blank-selector/
blank: function( a ) {
return !$.trim( "" + $( a ).val() );
},
// http://jqueryvalidation.org/filled-selector/
filled: function( a ) {
return !!$.trim( "" + $( a ).val() );
},
// http://jqueryvalidation.org/unchecked-selector/
unchecked: function( a ) {
return !$( a ).prop( "checked" );
}
});



// constructor for validator
$.validator = function( options, form ) {
this.settings = $.extend( true, {}, $.validator.defaults, options );
this.currentForm = form;
this.init();
};



// http://jqueryvalidation.org/jQuery.validator.format/
$.validator.format = function( source, params ) {
if ( arguments.length === 1 ) {
return function() {
var args = $.makeArray( arguments );
args.unshift( source );
return $.validator.format.apply( this, args );
};
}
if ( arguments.length > 2 && params.constructor !== Array ) {
params = $.makeArray( arguments ).slice( 1 );
}
if ( params.constructor !== Array ) {
params = [ params ];
}
$.each( params, function( i, n ) {
source = source.replace( new RegExp( "\\{" + i + "\\}", "g" ), function() {
return n;
});
});
return source;
};



$.extend( $.validator, {



defaults: {
messages: {},
groups: {},
rules: {},
errorClass: "error",
validClass: "valid",
errorElement: "label",
focusCleanup: false,
focusInvalid: true,
errorContainer: $( [] ),
errorLabelContainer: $( [] ),
onsubmit: true,
ignore: ":hidden",
ignoreTitle: false,
onfocusin: function( element ) {
this.lastActive = element;



// Hide error label and remove error class on focus if enabled
if ( this.settings.focusCleanup ) {
if ( this.settings.unhighlight ) {
this.settings.unhighlight.call( this, element, this.settings.errorClass, this.settings.validClass );
}
this.hideThese( this.errorsFor( element ) );
}
},
onfocusout: function( element ) {
if ( !this.checkable( element ) && ( element.name in this.submitted || !this.optional( element ) ) ) {
this.element( element );
}
},
onkeyup: function( element, event ) {
// Avoid revalidate the field when pressing one of the following keys
// Shift => 16
// Ctrl => 17
// Alt => 18
// Caps lock => 20
// End => 35
// Home => 36
// Left arrow => 37
// Up arrow => 38
// Right arrow => 39
// Down arrow => 40
// Insert => 45
// Num lock => 144
// AltGr key => 225
var excludedKeys = [
16, 17, 18, 20, 35, 36, 37,
38, 39, 40, 45, 144, 225
];



if ( event.which === 9 && this.elementValue( element ) === "" || $.inArray( event.keyCode, excludedKeys ) !== -1 ) {
return;
} else if ( element.name in this.submitted || element === this.lastElement ) {
this.element( element );
}
},
onclick: function( element ) {
// click on selects, radiobuttons and checkboxes
if ( element.name in this.submitted ) {
this.element( element );



// or option elements, check parent select in that case
} else if ( element.parentNode.name in this.submitted ) {
this.element( element.parentNode );
}
},
highlight: function( element, errorClass, validClass ) {
	
if ( element.type === "radio" ) {
this.findByName( element.name ).addClass( errorClass ).removeClass( validClass );
} else {
$( element ).addClass( errorClass ).removeClass( validClass );
}
},
unhighlight: function( element, errorClass, validClass ) {
if ( element.type === "radio" ) {
this.findByName( element.name ).removeClass( errorClass ).addClass( validClass );
} else {
$( element ).removeClass( errorClass ).addClass( validClass );
}
}
},



// http://jqueryvalidation.org/jQuery.validator.setDefaults/
setDefaults: function( settings ) {
$.extend( $.validator.defaults, settings );
},



messages: {
required: "This field is required.",
remote: "Please fix this field.",
email: "Please enter a valid email address.",
url: "Please enter a valid URL.",
date: "Please enter a valid date.",
dateISO: "Please enter a valid date ( ISO ).",
number: "Please enter a valid number.",
digits: "Please enter only digits.",
creditcard: "Please enter a valid credit card number.",
equalTo: "Please enter the same value again.",
maxlength: $.validator.format( "Please enter no more than {0} characters." ),
minlength: $.validator.format( "Please enter at least {0} characters." ),
rangelength: $.validator.format( "Please enter a value between {0} and {1} characters long." ),
range: $.validator.format( "Please enter a value between {0} and {1}." ),
max: $.validator.format( "Please enter a value less than or equal to {0}." ),
min: $.validator.format( "Please enter a value greater than or equal to {0}." )
},



autoCreateRanges: false,



prototype: {



init: function() {
this.labelContainer = $( this.settings.errorLabelContainer );
this.errorContext = this.labelContainer.length && this.labelContainer || $( this.currentForm );
this.containers = $( this.settings.errorContainer ).add( this.settings.errorLabelContainer );
this.submitted = {};
this.valueCache = {};
this.pendingRequest = 0;
this.pending = {};
this.invalid = {};
this.reset();



var groups = ( this.groups = {} ),
rules;
$.each( this.settings.groups, function( key, value ) {
if ( typeof value === "string" ) {
value = value.split( /\s/ );
}
$.each( value, function( index, name ) {
groups[ name ] = key;
});
});
rules = this.settings.rules;
$.each( rules, function( key, value ) {
rules[ key ] = $.validator.normalizeRule( value );
});



function delegate( event ) {
var validator = $.data( this.form, "validator" ),
eventType = "on" + event.type.replace( /^validate/, "" ),
settings = validator.settings;
if ( settings[ eventType ] && !$( this ).is( settings.ignore ) ) {
settings[ eventType ].call( validator, this, event );
}
}



$( this.currentForm )
.on( "focusin.validate focusout.validate keyup.validate",
":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'], " +
"[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], " +
"[type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], " +
"[type='radio'], [type='checkbox']", delegate)
// Support: Chrome, oldIE
// "select" is provided as event.target when clicking a option
.on("click.validate", "select, option, [type='radio'], [type='checkbox']", delegate);



if ( this.settings.invalidHandler ) {
$( this.currentForm ).on( "invalid-form.validate", this.settings.invalidHandler );
}



// Add aria-required to any Static/Data/Class required fields before first validation
// Screen readers require this attribute to be present before the initial submission http://www.w3.org/TR/WCAG-TECHS/ARIA2.html
$( this.currentForm ).find( "[required], [data-rule-required], .required" ).attr( "aria-required", "true" );
},



// http://jqueryvalidation.org/Validator.form/
form: function() {
this.checkForm();
$.extend( this.submitted, this.errorMap );
this.invalid = $.extend({}, this.errorMap );
if ( !this.valid() ) {
$( this.currentForm ).triggerHandler( "invalid-form", [ this ]);
}
this.showErrors();
return this.valid();
},



checkForm: function() {
this.prepareForm();
for ( var i = 0, elements = ( this.currentElements = this.elements() ); elements[ i ]; i++ ) {
this.check( elements[ i ] );
}
return this.valid();
},



// http://jqueryvalidation.org/Validator.element/
element: function( element ) {
var cleanElement = this.clean( element ),
checkElement = this.validationTargetFor( cleanElement ),
result = true;



this.lastElement = checkElement;



if ( checkElement === undefined ) {
delete this.invalid[ cleanElement.name ];
} else {
this.prepareElement( checkElement );
this.currentElements = $( checkElement );



result = this.check( checkElement ) !== false;
if ( result ) {
delete this.invalid[ checkElement.name ];
} else {
this.invalid[ checkElement.name ] = true;
}
}
// Add aria-invalid status for screen readers
$( element ).attr( "aria-invalid", !result );



if ( !this.numberOfInvalids() ) {
// Hide error containers on last error
this.toHide = this.toHide.add( this.containers );
}
this.showErrors();
return result;
},



// http://jqueryvalidation.org/Validator.showErrors/
showErrors: function( errors ) {
if ( errors ) {
// add items to error list and map
$.extend( this.errorMap, errors );
this.errorList = [];
for ( var name in errors ) {
this.errorList.push({
message: errors[ name ],
element: this.findByName( name )[ 0 ]
});
}
// remove items from success list
this.successList = $.grep( this.successList, function( element ) {
return !( element.name in errors );
});
}
if ( this.settings.showErrors ) {
this.settings.showErrors.call( this, this.errorMap, this.errorList );
} else {
this.defaultShowErrors();
}
},



// http://jqueryvalidation.org/Validator.resetForm/
resetForm: function() {
if ( $.fn.resetForm ) {
$( this.currentForm ).resetForm();
}
this.submitted = {};
this.lastElement = null;
this.prepareForm();
this.hideErrors();
var i, elements = this.elements()
.removeData( "previousValue" )
.removeAttr( "aria-invalid" );



if ( this.settings.unhighlight ) {
for ( i = 0; elements[ i ]; i++ ) {
this.settings.unhighlight.call( this, elements[ i ],
this.settings.errorClass, "" );
}
} else {
elements.removeClass( this.settings.errorClass );
}
},



numberOfInvalids: function() {
return this.objectLength( this.invalid );
},



objectLength: function( obj ) {
/* jshint unused: false */
var count = 0,
i;
for ( i in obj ) {
count++;
}
return count;
},



hideErrors: function() {
this.hideThese( this.toHide );
},



hideThese: function( errors ) {
errors.not( this.containers ).text( "" );
this.addWrapper( errors ).hide();
},



valid: function() {
return this.size() === 0;
},



size: function() {
return this.errorList.length;
},



focusInvalid: function() {
if ( this.settings.focusInvalid ) {
try {
$( this.findLastActive() || this.errorList.length && this.errorList[ 0 ].element || [])
.filter( ":visible" )
.focus()
// manually trigger focusin event; without it, focusin handler isn't called, findLastActive won't have anything to find
.trigger( "focusin" );
} catch ( e ) {
// ignore IE throwing errors when focusing hidden elements
}
}
},



findLastActive: function() {
var lastActive = this.lastActive;
return lastActive && $.grep( this.errorList, function( n ) {
return n.element.name === lastActive.name;
}).length === 1 && lastActive;
},



elements: function() {
var validator = this,
rulesCache = {};



// select all valid inputs inside the form (no submit or reset buttons)
return $( this.currentForm )
.find( "input, select, textarea" )
.not( ":submit, :reset, :image, :disabled" )
.not( this.settings.ignore )
.filter( function() {
if ( !this.name && validator.settings.debug && window.console ) {
console.error( "%o has no name assigned", this );
}



// select only the first element for each name, and only those with rules specified
if ( this.name in rulesCache || !validator.objectLength( $( this ).rules() ) ) {
return false;
}



rulesCache[ this.name ] = true;
return true;
});
},



clean: function( selector ) {
return $( selector )[ 0 ];
},



errors: function() {
var errorClass = this.settings.errorClass.split( " " ).join( "." );
return $( this.settings.errorElement + "." + errorClass, this.errorContext );
},



reset: function() {
this.successList = [];
this.errorList = [];
this.errorMap = {};
this.toShow = $( [] );
this.toHide = $( [] );
this.currentElements = $( [] );
},



prepareForm: function() {
this.reset();
this.toHide = this.errors().add( this.containers );
},



prepareElement: function( element ) {
this.reset();
this.toHide = this.errorsFor( element );
},



elementValue: function( element ) {
var val,
$element = $( element ),
type = element.type;



if ( type === "radio" || type === "checkbox" ) {
return this.findByName( element.name ).filter(":checked").val();
} else if ( type === "number" && typeof element.validity !== "undefined" ) {
return element.validity.badInput ? false : $element.val();
}



val = $element.val();
if ( typeof val === "string" ) {
return val.replace(/\r/g, "" );
}
return val;
},



check: function( element ) {
element = this.validationTargetFor( this.clean( element ) );



var rules = $( element ).rules(),
rulesCount = $.map( rules, function( n, i ) {
return i;
}).length,
dependencyMismatch = false,
val = this.elementValue( element ),
result, method, rule;



for ( method in rules ) {
rule = { method: method, parameters: rules[ method ] };
try {

result = $.validator.methods[ method ].call( this, val, element, rule.parameters );



// if a method indicates that the field is optional and therefore valid,
// don't mark it as valid when there are no other rules
if ( result === "dependency-mismatch" && rulesCount === 1 ) {
dependencyMismatch = true;
continue;
}
dependencyMismatch = false;



if ( result === "pending" ) {
this.toHide = this.toHide.not( this.errorsFor( element ) );
return;
}



if ( !result ) {
this.formatAndAdd( element, rule );
return false;
}
} catch ( e ) {
if ( this.settings.debug && window.console ) {
console.log( "Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.", e );
}
if ( e instanceof TypeError ) {
e.message += ". Exception occurred when checking element " + element.id + ", check the '" + rule.method + "' method.";
}



throw e;
}
}
if ( dependencyMismatch ) {
return;
}
if ( this.objectLength( rules ) ) {
this.successList.push( element );
}
return true;
},



// return the custom message for the given element and validation method
// specified in the element's HTML5 data attribute
// return the generic message if present and no method specific message is present
customDataMessage: function( element, method ) {
return $( element ).data( "msg" + method.charAt( 0 ).toUpperCase() +
method.substring( 1 ).toLowerCase() ) || $( element ).data( "msg" );
},



// return the custom message for the given element name and validation method
customMessage: function( name, method ) {
var m = this.settings.messages[ name ];
return m && ( m.constructor === String ? m : m[ method ]);
},



// return the first defined argument, allowing empty strings
findDefined: function() {
for ( var i = 0; i < arguments.length; i++) {
if ( arguments[ i ] !== undefined ) {
return arguments[ i ];
}
}
return undefined;
},



defaultMessage: function( element, method ) {
return this.findDefined(
this.customMessage( element.name, method ),
this.customDataMessage( element, method ),
// title is never undefined, so handle empty string as undefined
!this.settings.ignoreTitle && element.title || undefined,
$.validator.messages[ method ],
"<strong>Warning: No message defined for " + element.name + "</strong>"
);
},



formatAndAdd: function( element, rule ) {
var message = this.defaultMessage( element, rule.method ),
theregex = /\$?\{(\d+)\}/g;
if ( typeof message === "function" ) {
message = message.call( this, rule.parameters, element );
} else if ( theregex.test( message ) ) {
message = $.validator.format( message.replace( theregex, "{$1}" ), rule.parameters );
}
this.errorList.push({
message: message,
element: element,
method: rule.method
});



this.errorMap[ element.name ] = message;
this.submitted[ element.name ] = message;
},



addWrapper: function( toToggle ) {
if ( this.settings.wrapper ) {
toToggle = toToggle.add( toToggle.parent( this.settings.wrapper ) );
}
return toToggle;
},



defaultShowErrors: function() {
var i, elements, error;
for ( i = 0; this.errorList[ i ]; i++ ) {
error = this.errorList[ i ];
if ( this.settings.highlight ) {
this.settings.highlight.call( this, error.element, this.settings.errorClass, this.settings.validClass );
}
this.showLabel( error.element, error.message );
}
if ( this.errorList.length ) {
this.toShow = this.toShow.add( this.containers );
}
if ( this.settings.success ) {
for ( i = 0; this.successList[ i ]; i++ ) {
this.showLabel( this.successList[ i ] );
}
}
if ( this.settings.unhighlight ) {
for ( i = 0, elements = this.validElements(); elements[ i ]; i++ ) {
this.settings.unhighlight.call( this, elements[ i ], this.settings.errorClass, this.settings.validClass );
}
}
this.toHide = this.toHide.not( this.toShow );
this.hideErrors();
this.addWrapper( this.toShow ).show();
},



validElements: function() {
return this.currentElements.not( this.invalidElements() );
},



invalidElements: function() {
return $( this.errorList ).map(function() {
return this.element;
});
},



showLabel: function( element, message ) {
var place, group, errorID,
error = this.errorsFor( element ),
elementID = this.idOrName( element ),
describedBy = $( element ).attr( "aria-describedby" );
if ( error.length ) {
// refresh error/success class
error.removeClass( this.settings.validClass ).addClass( this.settings.errorClass );
// replace message on existing label
error.html( message );
} else {
// create error element
error = $( "<" + this.settings.errorElement + ">" )
.attr( "id", elementID + "-error" )
.addClass( this.settings.errorClass )
.html( message || "" );



// Maintain reference to the element to be placed into the DOM
place = error;
if ( this.settings.wrapper ) {
// make sure the element is visible, even in IE
// actually showing the wrapped element is handled elsewhere
place = error.hide().show().wrap( "<" + this.settings.wrapper + "/>" ).parent();
}
if ( this.labelContainer.length ) {
this.labelContainer.append( place );
} else if ( this.settings.errorPlacement ) {
this.settings.errorPlacement( place, $( element ) );
} else {
place.insertAfter( element );
}



// Link error back to the element
if ( error.is( "label" ) ) {
// If the error is a label, then associate using 'for'
error.attr( "for", elementID );
} else if ( error.parents( "label[for='" + elementID + "']" ).length === 0 ) {
// If the element is not a child of an associated label, then it's necessary
// to explicitly apply aria-describedby



errorID = error.attr( "id" ).replace( /(:|\.|\[|\]|\$)/g, "\\$1");
// Respect existing non-error aria-describedby
if ( !describedBy ) {
describedBy = errorID;
} else if ( !describedBy.match( new RegExp( "\\b" + errorID + "\\b" ) ) ) {
// Add to end of list if not already present
describedBy += " " + errorID;
}
$( element ).attr( "aria-describedby", describedBy );



// If this element is grouped, then assign to all elements in the same group
group = this.groups[ element.name ];
if ( group ) {
$.each( this.groups, function( name, testgroup ) {
if ( testgroup === group ) {
$( "[name='" + name + "']", this.currentForm )
.attr( "aria-describedby", error.attr( "id" ) );
}
});
}
}
}
if ( !message && this.settings.success ) {
error.text( "" );
if ( typeof this.settings.success === "string" ) {
error.addClass( this.settings.success );
} else {
this.settings.success( error, element );
}
}
this.toShow = this.toShow.add( error );
},



errorsFor: function( element ) {
var name = this.idOrName( element ),
describer = $( element ).attr( "aria-describedby" ),
selector = "label[for='" + name + "'], label[for='" + name + "'] *";



// aria-describedby should directly reference the error element
if ( describer ) {
selector = selector + ", #" + describer.replace( /\s+/g, ", #" );
}
return this
.errors()
.filter( selector );
},



idOrName: function( element ) {
return this.groups[ element.name ] || ( this.checkable( element ) ? element.name : element.id || element.name );
},



validationTargetFor: function( element ) {



// If radio/checkbox, validate first element in group instead
if ( this.checkable( element ) ) {
element = this.findByName( element.name );
}



// Always apply ignore filter
return $( element ).not( this.settings.ignore )[ 0 ];
},



checkable: function( element ) {
return ( /radio|checkbox/i ).test( element.type );
},



findByName: function( name ) {
return $( this.currentForm ).find( "[name='" + name + "']" );
},



getLength: function( value, element ) {
switch ( element.nodeName.toLowerCase() ) {
case "select":
return $( "option:selected", element ).length;
case "input":
if ( this.checkable( element ) ) {
return this.findByName( element.name ).filter( ":checked" ).length;
}
}
return value.length;
},



depend: function( param, element ) {
return this.dependTypes[typeof param] ? this.dependTypes[typeof param]( param, element ) : true;
},



dependTypes: {
"boolean": function( param ) {
return param;
},
"string": function( param, element ) {
return !!$( param, element.form ).length;
},
"function": function( param, element ) {
return param( element );
}
},



optional: function( element ) {
var val = this.elementValue( element );
return !$.validator.methods.required.call( this, val, element ) && "dependency-mismatch";
},



startRequest: function( element ) {
if ( !this.pending[ element.name ] ) {
this.pendingRequest++;
this.pending[ element.name ] = true;
}
},



stopRequest: function( element, valid ) {
this.pendingRequest--;
// sometimes synchronization fails, make sure pendingRequest is never < 0
if ( this.pendingRequest < 0 ) {
this.pendingRequest = 0;
}
delete this.pending[ element.name ];
if ( valid && this.pendingRequest === 0 && this.formSubmitted && this.form() ) {
$( this.currentForm ).submit();
this.formSubmitted = false;
} else if (!valid && this.pendingRequest === 0 && this.formSubmitted ) {
$( this.currentForm ).triggerHandler( "invalid-form", [ this ]);
this.formSubmitted = false;
}
},



previousValue: function( element ) {
return $.data( element, "previousValue" ) || $.data( element, "previousValue", {
old: null,
valid: true,



	
	
	
	
	
	
	
	
	
	
	
	
	
	
	