# zdForm
    
    ver 1.1 | last updated: 2020-05-20

### How to get it

```
<!-- Get patch fixes within a minor version -->
<script src="https://cdn.jsdelivr.net/gh/sarapulov/zdForm@1.1.0/zdForm.js"></script>

<!-- Always get the latest version -->
<!-- Not recommended for production sites! -->
<script src="https://cdn.jsdelivr.net/gh/sarapulov/zdForm/zdForm.js"></script>
```

### use case:

        1. hide desired ticket fields on selected HC form
        2. preset subject/text/numeric/dropdowns fields with configured values
        3. preset subject/text/numeric/dropdowns fields with a value from one of non-empty fields 
        4. preset fields real time or on submit event

### to run:

        1 - deploy JS code in a <script> tag on new_request_page.hbs template
        2 - configure as per instructions below

        2.1

        jQuery(document).ready(function () {
            
            // OPTIONAL hasAnyUserTag method accepts array of tags and return true if at least one of them is presented on Help Center user
            if (zdForm().hasAnyUserTag(['test'])) {
                
                zdForm().init({

                    // MANDATORY - ticket form ID where script will be executed
                    "12405": {
                    
                    // MANDATORY - Field with this FIELD ID will be set by this script
                    "field_id_to_set":"request_subject", 
                    
                    // MANDATORY - TEMPLATE for setting the field
                    "field_value_to_set":"{[{request_custom_fields_23506078}]} - {[{request_issue_type_select}]} - {[{one_of_the_field_ids_to_get}]} - {[{user_input}]}",
                    
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
                    "user_has_any_tag":['test', '/ams::/']
                    }
                
                });
            }
        });

        2.2

        "field_value_to_set" template supports the following entires:

            {[{request_issue_type_select}]} - will return currently selected ticket form name
            {[{request_custom_fields_23506078}]} - will return a label (for dropdowns) and a value (for text & numeric) custom fields
            {[{one_of_the_field_ids_to_get}]} - will return the first non empty field label/value from a list of field specified in "one_of_the_field_ids_to_get"
            {[{user_input}]} - ONLY WORKS WHEN "set_on_submit": true Will return the manual user input for a given field on submit event.
                                If submit failed the desired field will be emptied. If "set_on_submit": false this placeholder will return empty string

        2.3

        In some cases the ticket submission form can be controlled by another scripts. For example, if another script forces some of the fields to be required and
        validate the fields at submit event you may need to execute a call back to inform THIS script about submission failure. Here is example how this may work.

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

        The other script need to call the following callback when submission has failed AT SUBMIT EVENT. So THIS script will revert back the values.

        zdForm().handleSubmissionError(request_subject_config)

        NOTE:
            - this only valid when "set_on_submit": true Otherwise, this behaviour will be ignored
            - "field_value_to_set" must contain {[{user_input}]} Otherwise, the logic doesn't make sense and will be ignored
            - since call back requires the same config object make sure that THIS script is loaded BEFORE the other script which handles the submit event

        3 - test

### dependency:

        - jQuery

### notes:

        - script was developed and tested for Zendesk Guide templates v1
        - tests covered dropdowns (incl. nested dropdowns) & ticket form fields, simple form submissions and submission failures