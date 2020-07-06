// ver 1.2.2 | last updated: 2020-07-06
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
	   		setDefaultValue(formSettings);
	   		extendFormSetting(formSettings);
	   		cleanLocalStorage(formSettings);

	   		if (formSettings.set_on_submit) listenSubmitEvent(formSettings); else addEventListener(formSettings);	   		
	   	}
	   function setDefaultValue(formSettings){ // set default field value to Ticket Form name unless static value is provided
	   		var fieldValue = (formSettings.default_field_value !== undefined) ? formSettings.default_field_value : getFieldValue('request_issue_type_select');
	   		if ((formSettings.user_input !== undefined) && formSettings.is_form_submitted) fieldValue = formSettings.user_input;
	   		setField(formSettings, fieldValue);
	   }
	   function extendFormSetting(formSettings){ // extract field IDs from the settings and process placeholders with logic
	   		formSettings.ignore_placeholders = ['one_of_the_field_ids_to_get','request_issue_type_select','user_input'];

	   		var fields_to_process_objects = formSettings.field_value_to_set.match(/{\[{([^}\]}]+)}\]}/g).map(function(res) {
	   			
	   			var placeholder = res.replace(/{\[{|}\]}/g , '');
	   			var placeholderArray = placeholder.split('|');
	   			var field_id = placeholderArray[0].trim();
	   			// field_text output is not trimmed on purpose. So line breaks can be used in the script config
	   			var field_text = (placeholderArray.length > 1) ? (placeholderArray[1] + ' ') : '';

	   			return {
	   				placeholder: placeholder,
	   				field_id: field_id,
	   				field_text: ( field_text.indexOf('FIELD_LABEL') > -1 ) ? field_text.replace('FIELD_LABEL', jQuery('label[for="' + field_id + '"]').text()) : field_text,
	   				has_text: !!( (placeholderArray.length > 1) && (placeholderArray[1].trim().length > 1) )
	   			};
	   		});

	   		formSettings.fields_to_process_objects = fields_to_process_objects;

	   		var fields_to_process = fields_to_process_objects.map(function(field) { return field.field_id; });
	   		
	   		formSettings.fields_to_process = fields_to_process;
	   		formSettings.field_ids_to_listen = fields_to_process.concat(formSettings.one_of_the_field_ids_to_get);

	   		for(var i = formSettings.field_ids_to_listen.length - 1; i >= 0; i--) {
			    if(formSettings.field_ids_to_listen[i] == 'one_of_the_field_ids_to_get') formSettings.field_ids_to_listen.splice(i, 1);
			}
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
		   			result[field_reference] = formSettings.set_on_submit ? getFieldValue(formSettings.field_id_to_set) : '';
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
	   		jQuery('#'+formSettings.field_id_to_set).val((optionalValue !== undefined) ? optionalValue : formSettings.processed_field_value_to_set);
	   }
	   function listenSubmitEvent(formSettings) { // run logic on form submit event
	   		// For some weird reasons jQuery('form#new_request').on('submit', function(e){ doesn't work
	   		// for Anonymous visitors, but works for end-users
	   		// Event listener will not be added when form submission has failed

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
	      if (msg) console.warn('[' + new Date.now().toLocaleDateString() + '] TICKET FORM FIELDS PRESET SCRIPT ERROR: ' + msg);
	   }

	return mdl;
};