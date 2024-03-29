/********************

# zdForm
    
ver 1.2.7 | last updated: 2023-01-26

### How to get it

```
<!-- Get patch fixes within a minor version -->
https://cdn.jsdelivr.net/gh/sarapulov/zdForm@1.2.0/zdForm.js

<!-- Always get the latest version -->
<!-- Not recommended for production sites! -->
https://cdn.jsdelivr.net/gh/sarapulov/zdForm/zdForm.js
```

It is important to load this script in the HEAD or on all following pages:

- home_page
- new_request_page
- request_page

### use case:

1. hide desired ticket fields on selected HC form
2. preset subject/text/numeric/dropdowns fields with configured values
3. preset subject/text/numeric/dropdowns fields with a value from one of non-empty fields 
4. preset fields real time or on submit event
5. show desired fields only when they have a value

### to run:

1. deploy JS code in a SCRIPT tag on new_request_page.hbs template
2. configure as per instructions below

2.1

```
jQuery(document).ready(function () {
    
    // OPTIONAL hasAnyUserTag method accepts array of tags and return true if at least one of them is presented on Help Center user
    if (zdForm().hasAnyUserTag(['test'])) {
        
        zdForm().init({

            // MANDATORY - ticket form ID where script will be executed
            "12405": {
            
            // MANDATORY - Field with this FIELD ID will be set by this script
            "field_id_to_set":"request_subject", 
            
            // MANDATORY - TEMPLATE for setting the field
            "field_value_to_set":"{[{request_custom_fields_23506078|FIELD_LABEL:}]} - {[{request_issue_type_select}]} - {[{one_of_the_field_ids_to_get}]} - {[{user_input}]}",
            
            // OPTIONAL - list of FIELD IDs that will be used to replace {[{one_of_the_field_ids_to_get}]} placeholder. Firts non-empty field will win
            "one_of_the_field_ids_to_get":["request_custom_fields_23496063","request_custom_fields_23530886","request_custom_fields_23502577"],
            
            // OPTIONAL - default field value. If udnerfined Ticket Form value will be used
            "default_field_value": undefined,
            
            // OPTIONAL - list of FIELD IDs that will be hidden by this script
            "field_ids_to_hide":["request_subject"],
            
            // OPTIONAL - if 'false' - field will be set real time; if 'true' - field will be set on form submit event
            "set_on_submit":false,

            // OPTIONAL - array of Help Center user tags. If any of tags is presented on Help Center user the script will run.
            // if not undefined the script will run. If empty array is defined the script will not run
            // Array accept the following entries '/{ANY STRING TO MATCH}/' this will be used as a regular expression to test whether
            // given user tag match the patter. For example, using '/ams::/' as one of the entry will be evaluated as TRUE for the
            // following tags: ams::45, ams::123456, ams::, ams::test
            "user_has_any_tag":['test', '/ams::/'],

			// OPTIONAL - if 'true' - the empty dropdown field will return an empty string. Otherwise, it will be a dash ('-')
            "no_dash_for_empty_dropdown": true
            }
        
        });
    }
});
```

2.2

"field_value_to_set" template supports the following entires:

```
{[{request_issue_type_select}]} - will return currently selected ticket form name
{[{request_custom_fields_23506078}]} - will return a label (for dropdowns) and a value (for text & numeric) custom fields
{[{one_of_the_field_ids_to_get}]} - will return the first non empty field label/value from a list of field specified in "one_of_the_field_ids_to_get"
{[{user_input}]} - ONLY WORKS WHEN "set_on_submit": true Will return the manual user input for a given field on submit event.
                    If submit failed the desired field will be emptied. If "set_on_submit": false this placeholder will return empty string
```

"field_value_to_set" template supports placeholders with additional attributes:

```
{[{request_custom_fields_23506078|MY FIELD LABEL:}]}
{[{request_custom_fields_23506078|FIELD_LABEL:}]}

It is also possible to inject spaces and linebreaks:

{[{request_custom_fields_23506078| \nFIELD_LABEL: }]}
```

If additional attributes is passed after the pipe character it will be used a text before the value (label).
Both label and the value will only be shown when field has non empty value.

Example 1:
    Field with id = `request_custom_fields_23506078` is labeled as "REQUEST TYPE" has a value of "REFUND".
    `{[{request_custom_fields_23506078|MY FIELD LABEL:}]}` will resolve into `MY FIELD LABEL: REFUND`
    `{[{request_custom_fields_23506078|FIELD_LABEL:}]}` will resolve into `REQUEST TYPE: REFUND` (keyword "FIELD_LABEL" will get the current field label automatically)

Example 2:
    Field with id = `request_custom_fields_23506078` is labeled as "REQUEST TYPE" has a value of "" (field is empty)
    `{[{request_custom_fields_23506078|MY FIELD LABEL:}]}` will resolve into "" (empty string)
    `{[{request_custom_fields_23506078|FIELD_LABEL:}]}` will resolve into "" (empty string)

2.3

In some cases the ticket submission form can be controlled by another scripts. For example, if another script forces some of the fields to be required and
validate the fields at submit event you may need to execute a call back to inform THIS script about submission failure. Here is example how this may work.

```
var request_subject_config = {
        "12405": {
            "field_id_to_set":"request_subject",
            "field_value_to_set":"{[{user_input}]} --- {[{request_custom_fields_23506078}]} :: {[{request_issue_type_select}]} :: {[{one_of_the_field_ids_to_get}]}",
            // "one_of_the_field_ids_to_get":["request_custom_fields_23496063","request_custom_fields_23530886","request_custom_fields_23502577"],
            "default_field_value": "",
            // "field_ids_to_hide":["request_subject"],
            "set_on_submit": true,
            "user_has_any_tag":['test','/ams::/']
        }
    };

zdForm().init(request_subject_config);
```

The other script need to call the following callback when submission has failed AT SUBMIT EVENT. So THIS script will revert back the values.

```
zdForm().handleSubmissionError(request_subject_config)
```

NOTE:
    - this only valid when "set_on_submit": true Otherwise, this behaviour will be ignored
    - "field_value_to_set" must contain {[{user_input}]} Otherwise, the logic will not make any sense and will be ignored
    - since call back requires the same config object make sure that THIS script is loaded BEFORE the other script which handles the submit event


The following public methods are supported:

```
zdForm().init({ SCRIPT CONFIG OBJECT }) - runs the script
zdForm().hasAnyUserTag(['test,'/office:/']) - TRUE if current user has at least one of the tags OR at least one tag is matching the pattern
zdForm().handleSubmissionError({ SCRIPT CONFIG OBJECT }) - should be called by another script which controls the form submission at the error event
zdForm().isNotTicketForm() - TRUE is current page is not the ticket form
zdForm().cleanAllLocalStorage() - will remove script specific record from the local storage

```

If Help Text text editor is using the rich editor it will be possible to use the HTML in the script setting. The following HTML is supported.
Custom stly attribute is supported too!

```
<p style='color:red;'>Normal text</p>
<pre>Code</pre>
<h2>Header 2</h2>
<h3>Header 3</h3>
<h4>Header 4</h4>
<p><strong>bold</strong></p>
<p><em>italic</em></p>
<ul>
<li>ordered item 1</li>
<li>ordered item 2</li>
</ul>
<ol>
<li>numbered item 1</li>
<li>numbered item 2</li>
</ol>
<a href="https://zendesk.com" target="_blank" rel="noopener">link</a>
```

Example:

```
...
"field_value_to_set":"-----------<br>Here is the list of fields: <br><br>{[{request_issue_type_select}]}<br>{[{one_of_the_field_ids_to_get}]}{[{request_custom_fields_24156879|   <br><strong style='color:red;'>#FIELD_LABEL =></strong>  }]}{[{request_custom_fields_23506078| <br><strong style='color:red;'>FIELD_LABEL:</strong>    }]}<br> <i>HISTORY:</i> {[{request_custom_fields_23194496| <br>FIELD LABEL IN ALL UPPERCASE: }]}",
...
```


3 - test

### notes:

In case when Help Center is using single ticket form it may require to run the script in either of the following places:

1. `new_request_page.hbs` and `home_page.hbs`
2. any global page where JavaScript can be executed: `head`, `footer`, `script.js`

It is enough to run a script with empty object as a paremeter:

```
document.addEventListener('DOMContentLoaded', function() { zdForm && zdForm().init({}); })
```

### dependency:

- jQuery

### notes:

- script was developed and tested for Zendesk Guide templates v1
- tests covered dropdowns (incl. nested dropdowns) & ticket form fields, simple form submissions and submission failures

********************/

var zdForm = function() {
	'use strict';
		var mdl = {};
	 	/* ============ PUBLIC METHODS ============ */
	   	mdl.init = function(params) { // check params and initiate the script
	      	if (params) {
	      		initiate(params);
	   		} else {
	         	showError('CONFIGURATION IS MISSING, BROKEN OR MISSFORMATTED. SCRIPT WILL NOT RUN.');
	         	return;
	      	}
	   	};
	   	mdl.hasAnyUserTag = function(listOfUserTags) { // return true if Help Center user has at least one tag or matching the regex pattern
	   		var hasTags,
	   			h = HelpCenter,
	   			hasHelpCenter = h && h.user && h.user.tags && h.user.tags.length;
	   		
	   		if (listOfUserTags && hasHelpCenter) {
	   			hasTags = listOfUserTags.filter(function(n) {
				    var isMatchPattern;

	   				if (n.indexOf('/') > -1) {
	   					var re = new RegExp(n.replace(/\//g, ''));
	   					for (var i = 0; i < h.user.tags.length; i++) {
	   						if (re.test(h.user.tags[i])) {
	   							isMatchPattern = true;
	   							break;
	   						}
	   					}
	   				}
				    return (h.user.tags.indexOf(n) !== -1) || !!isMatchPattern;
				});
	   		}
	   		return !!hasTags && !!hasTags.length;
	   	}
	   	mdl.handleSubmissionError = function(params) { // call this method when script need to re-run. For example, when form submission is controlled by another script and submission failed
	   		if (params) {
	   			params.is_callback = true;
	   			initiate(params);
	   		}
	   	}
	   	mdl.isNotTicketForm = function() { // verify the ticket form location
	   		var form = document.getElementById('new_request');
	   		return !((window.location.href.indexOf('/requests') > -1) && form && form.getElementsByTagName('footer') && (form.getElementsByTagName('footer').length > 0));
	  	}
	  	mdl.cleanAllLocalStorage = function() { // remove all script related local storage data
	   		window.localStorage && window.localStorage.removeItem(getLocaleStorageKey());
	   	}
	  	/* ============ PRIVATE METHODS ============ */
	   	function initiate(params) { // initiate the logic
	   		if (mdl.isNotTicketForm()) {
	   			mdl.cleanAllLocalStorage();
	   			return;
	   		}
	   		var formSettings = getSettings(params);

	   		if (formSettings) formSettings.is_callback = params.is_callback;
			
	   		if (formSettings && (mdl.hasAnyUserTag(formSettings.user_has_any_tag) || formSettings.user_has_any_tag == undefined)) executeSettings(formSettings);	
	   	}
	   	function getTicketFormID() { // return ticket form ID
	   		return document.getElementById('request_issue_type_select').value || document.getElementById('request_ticket_form_id').value;
	   	}
	   	function getSettings(params) { // return settings for a given ticket form
	   		var settings = params[getTicketFormID()];
	   		return settings && getLocalStorage(settings) || settings;
	   	}
	   	function executeSettings(formSettings) { // execute required logic
	   		hideFields(formSettings);
	   		extendFormSetting(formSettings);
	   		setDefaultValue(formSettings);
	   		cleanLocalStorage(formSettings);

	   		if (formSettings.set_on_submit) listenSubmitEvent(formSettings); else addEventListener(formSettings);	   		
	   	}
	   function setDefaultValue(formSettings){ // set default field value to Ticket Form name unless static value is provided
	   		var fieldValue = (formSettings.default_field_value !== undefined) ? formSettings.default_field_value : getFieldValue('request_issue_type_select',formSettings);
	   		if ((formSettings.user_input !== undefined) && formSettings.is_form_submitted) fieldValue = formSettings.user_input;
	   		setField(formSettings, fieldValue);
	   }
	   function extendFormSetting(formSettings){ // extract field IDs from the settings and process placeholders with logic
	   		formSettings.ignore_placeholders = ['one_of_the_field_ids_to_get','request_issue_type_select','user_input'];

	   		var fields_to_process_objects = (formSettings.field_value_to_set.match(/{\[{([^}\]}]+)}\]}/g) || []).map(function(res) {
	   			
	   			var placeholder = res.replace(/{\[{|}\]}/g , '');
	   			var placeholderArray = placeholder.split('|');
	   			var field_id = placeholderArray[0].trim();
	   			// field_text output is not trimmed on purpose. So line breaks can be used in the script config
	   			var field_text = (placeholderArray.length > 1) ? (placeholderArray[1] + ' ') : '';

	   			return {
	   				placeholder: placeholder,
	   				field_id: field_id,
	   				field_text: ( field_text.indexOf('FIELD_LABEL') > -1 ) ? field_text.replace('FIELD_LABEL', jQuery('label[for="' + field_id + '"]').text()) : field_text,
	   				has_text: !!( (placeholderArray.length > 1) && (placeholderArray[1].trim().length > 0) )
	   			};
	   		});

	   		formSettings.fields_to_process_objects = fields_to_process_objects;

	   		var fields_to_process = fields_to_process_objects.map(function(field) { return field.field_id; });
	   		
	   		formSettings.fields_to_process = fields_to_process;
	   		formSettings.field_ids_to_listen = fields_to_process.concat(formSettings.one_of_the_field_ids_to_get);

	   		for(var i = formSettings.field_ids_to_listen.length - 1; i >= 0; i--) {
			    if(formSettings.field_ids_to_listen[i] == 'one_of_the_field_ids_to_get') formSettings.field_ids_to_listen.splice(i, 1);
			}

			// intended for request_description when it uses wysiwyg editor
			formSettings.isRichEditor = jQuery('#'+formSettings.field_id_to_set).attr('data-helper') == 'wysiwyg';
	   }
	   function hideFields(formSettings) { // hide listed fields
	   		var field_ids_to_hide = formSettings.field_ids_to_hide || [];
	   		for (var i = 0; i < field_ids_to_hide.length; i++) {
	   			jQuery('#'+field_ids_to_hide[i]).parent().hide();
	   		}
	   }
	   function addEventListener(formSettings) { // attach change event listeners to fields that have changed
	   		var fields_to_listen = formSettings.field_ids_to_listen || [];
	   		for (var i = 0; i < fields_to_listen.length; i++) {
	   			jQuery('#'+fields_to_listen[i]).on('change',function(e) {
			        handleFieldChange(formSettings);
			     });
	   		}
	   }
	   function handleFieldChange(formSettings) { // handle event(s) when fields a changing
	   		var results = getFields(formSettings);
	   		processValues(formSettings, results);
	   		setField(formSettings);
	   }
	   function getFields(formSettings) { // returning fields
	   		var result = {}, hasOneOfTheFields;

	   		for (var i = 0; i < formSettings.fields_to_process.length; i++) {
	   			var field_reference = formSettings.fields_to_process[i];
	   			
	   			if (field_reference == 'one_of_the_field_ids_to_get') {
	   				hasOneOfTheFields = true;
	   			} else if ((field_reference == 'user_input') ) {
		   			result[field_reference] = formSettings.set_on_submit ? getFieldValue(formSettings.field_id_to_set, formSettings) : '';
		   			formSettings.user_input = result[field_reference];
	   			} else {
	   				result[field_reference] = getFieldValue(field_reference, formSettings);
	   			}
	   		}
	   		
	   		if (hasOneOfTheFields) result.one_of_the_field_ids_to_get = getOneOfTheFields(formSettings) || '';
	   		
	   		return result;
	   }
	   function getOneOfTheFields(formSettings) { // return first non empty field value from a given list
	   		var val, field_ids = formSettings.one_of_the_field_ids_to_get;
			for (var i = 0; i < field_ids.length; i++) {
				var field_val = getFieldValue(field_ids[i], formSettings);
				if (((field_val !== '-') && (field_val !== ''))) {
					val = field_val;
					break;
				}
			}
	   		return val;
	   }
	   function getFieldValue(field_id, formSettings) { // return human friendly field value
	   		var $field = jQuery('#'+field_id);
	   		var val = $field.val();

	   		if ($field.is('[data-tagger]')) { // handle HC dropdowns
	   			var json = JSON.parse($field.attr('data-tagger'));
	   			val = flattenArray(json)[val];
	   			if (formSettings.no_dash_for_empty_dropdown && (val == '-')) val = '';
	   		}
	   		if (field_id == 'request_issue_type_select') { // handle ticket form selector
	   			val = $field.find('option[selected="selected"]').text();
	   		}
	   		if (formSettings.ignore_placeholders.indexOf(field_id) < 0) { // calculates the value for placeholders with the custom text
	   			var fieldObject = getFieldObject(field_id, formSettings);
	   			if (fieldObject && fieldObject.has_text) {
	   				val = isEmpty(val) ? val : fieldObject.field_text + val;
	   			}
	   		}
	   		return val;
	   }
	   function getFieldObject(field_id, formSettings) { // return a single object for a given field
	   		var fieldObject, fieldObjects = formSettings.fields_to_process_objects;
	   		if (field_id && fieldObjects) {
	   			for (var i = 0; i < fieldObjects.length; i++) {
	   				if (field_id == fieldObjects[i].field_id) {
	   					return fieldObjects[i];
	   					break;
	   				}
	   			}
	   		}
	   		return fieldObject;
	   }
	   function flattenArray(fieldValues) { // flatten dropdown with nested levels
	   		var results = {};

	   		function recursiveLoop(fieldOptions) {
	   			if (fieldOptions) {
	   				for (var i = 0; i < fieldOptions.length; i++) {
			   			if (fieldOptions[i].options) {
			   				recursiveLoop(fieldOptions[i].options);
			   			} else {
			   				results[(fieldOptions[i].value)] = fieldOptions[i].label;
			   			}
			   		}
	   			}
	   		}
	   		recursiveLoop(fieldValues);

	   		return results;
	   }
	   function processValues(formSettings, results) { // inject values into template
	   		formSettings.processed_field_value_to_set = formSettings.field_value_to_set;
	   		for (var key in results) {
	        	var fieldObject = getFieldObject(key, formSettings);
        		if (fieldObject && fieldObject.has_text) {
        			var fieldValue = isEmpty(results[key]) ? '' : results[key];
        			formSettings.processed_field_value_to_set = formSettings.processed_field_value_to_set.replace('{[{' + fieldObject.placeholder + '}]}', fieldValue);
        		} else {
        			formSettings.processed_field_value_to_set = formSettings.processed_field_value_to_set.replace('{[{' + key + '}]}', results[key]);	
        		}
	      	}
	   }
	   function isEmpty(v){
	   		return ( v == undefined || v == null || v == '' || v == '-' );
	   }
	   function setField(formSettings, optionalValue) { // set field
	   		if (formSettings.isRichEditor) { // used TinyMCE Rich editor API to set the content
	   			tinyMCE.get(formSettings.field_id_to_set).setContent((optionalValue !== undefined) ? optionalValue : formSettings.processed_field_value_to_set)
	   		} else {
	   			jQuery('#'+formSettings.field_id_to_set).val((optionalValue !== undefined) ? optionalValue : formSettings.processed_field_value_to_set);
	   		}
	   }
	   function listenSubmitEvent(formSettings) { // run logic on form submit event
	   		// For some weird reasons jQuery('form#new_request').on('submit', function(e){ doesn't work
	   		// for Anonymous visitors, but works for end-users
	   		// Event listener will not be added when form submission has failed
	   		// Issues with this approach were reported in the Guide Theme after version 2.5.0

	   		if (!formSettings.is_callback || !formSettings.is_form_submitted) {
	   			jQuery('#new_request').find('input[type="submit"]').on('click', function(e){
					handleSubmit(formSettings)
				});
	   		}
	   }
	   function handleSubmit(formSettings) {
	   		handleFieldChange(formSettings);
			formSettings.is_form_submitted = true;
			setLocalStorage(formSettings);
				
			return true;
	   }
	   function getLocaleStorageKey() { // returns the local storage reference for all script related data
	   		return '_zdForm_';
	   }
	   function getLocalStorageAttribute(formSettings) { // calculates the object key for a particular setting
	   		return getTicketFormID() + '_' + formSettings.field_id_to_set;
	   }
	   function setLocalStorage(formSettings) { // set local storage with a particualr setting
	   		if (window.localStorage) {
	   			var currentValue = JSON.parse(window.localStorage.getItem(getLocaleStorageKey()));
	   			if (currentValue) {
	   				currentValue[getLocalStorageAttribute(formSettings)] = formSettings;
	   				window.localStorage.setItem(getLocaleStorageKey(), JSON.stringify(currentValue));
	   			} else {
	   				window.localStorage.setItem(getLocaleStorageKey(), JSON.stringify({ [getLocalStorageAttribute(formSettings)]:formSettings }));
	   			}
	   		}
	   }
	   function getLocalStorage(formSettings) { // extract the value for a particular setting from the local storage
	   		var result;
	   		if (window.localStorage) result = JSON.parse(window.localStorage.getItem(getLocaleStorageKey()));
	   		return (result !== null) ? result[getLocalStorageAttribute(formSettings)] : '';
	   }
	   function cleanLocalStorage(formSettings) { // remove a particular setting from the local storage. When script runs for multiple fields on the same ticket form
	   		if (window.localStorage) {
	   			var currentValue = JSON.parse(window.localStorage.getItem(getLocaleStorageKey()));

	   			if (currentValue) {
	   				if (Object.keys(currentValue).length == 1) {
	   					mdl.cleanAllLocalStorage()
		   			} else {
		   				delete currentValue[getLocalStorageAttribute(formSettings)];
	   					window.localStorage.setItem(getLocaleStorageKey(), JSON.stringify(currentValue));
		   			}
	   			}
	   		}
		}
	   function showError(msg) { // log messages to the console
	      if (msg) console.warn('[' + new Date.now().toLocaleDateString() + '] TICKET FORM FIELDS PRESET SCRIPT (zdForm) ERROR: ' + msg);
	   }

	return mdl;
};