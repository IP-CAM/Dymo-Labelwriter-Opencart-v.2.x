/**
 * Created by Paul Wijnberg on 8-3-2015.
 * http://labelwriter.com/software/dls/sdk/js/DYMO.Label.Framework.3.0.js
 * http://developers.dymo.com/2016/08/08/dymo-label-web-service-faq/
 * http://developers.dymo.com/2018/05/29/updated-js-sdk-and-dls/
 * http://developers.dymo.com/2015/09/24/dymo-label-framework-javascript-library-2-0-open-beta-2/
 * http://www.labelwriter.com/software/dls/sdk/samples/js/PrintLabel/PrintLabel.html
 */
$(document).ready(function () {

    //first printer that is available
    var mainPrinter = null;
    //the target .label file
    var label = null;

    //check if print button and link are defined
    if ($('button.button-wd-label').length > 0 && $('input#wddymo-link').length > 0) {
        //register click event
        $('button.button-wd-label').click(function () {
            printLabel(this);
        });

        //load setttings
        loadPrinter();
        loadLabel();
    }

    /**
     * Gets all available Dymo printers by the Dymo SDK.
     * Sets the first printer as the main printer.
     */
    function loadPrinter() {
        var printers = dymo.label.framework.getPrinters();
        if (printers.length == 0) {
            console.log("No Dymo printers found.");

        } else {
            if (printers[0].printerType == "LabelWriterPrinter") {
                mainPrinter = printers[0];
                console.log('Main printer: ' + mainPrinter.name);
            } else {
                console.log("No Dymo LabelWriter printers found.");
            }
        }

    }

    /**
     * Loads the .label file with an AJAX request.
     */
    function loadLabel() {
        //TODO make this more relative
        $.get("view/javascript/wddymo/label.label", function (labelXml) {
            label = dymo.label.framework.openLabelXml(labelXml);
            // check if the .label file has an address object
            if (label.getAddressObjectCount() == 0) {
                console.log('Label file (\'/view/javascript/wddymo/label.label\') does not contain an address object.');
                return;
            }
            console.log('Label loaded.');

        }, "text");
    }

    /**
     * Starts the print action if a printer is present and if a .label file is loaded.
     */
    function printLabel(calledElement) {
        if (!mainPrinter) {
            console.log('No printer available.');
            return;
        }

        if (!label) {
            console.log('Label not loaded.');
            return;
        } else {
            var orderIds = [];

            //get nearest form (in case of multiple forms, such as invoice lists)
            var firstForm = $(calledElement).next('form:first');
            if (firstForm.length == 0) {
                firstForm = $('form:first');
            }

            //get all checked checkboxes in the form
            $('input[type="checkbox"]', firstForm).each(function () {
                //check if this checkbox is checked
                if ($(this).is(':checked')) {
                    //if this checkbox has a integer as value (an order id)
                    //else it's probably the first checkbox to check all orders...
                    var id = parseInt(this.value);
                    if (id > 0) {
                        orderIds.push(id);
                    }
                }
            });

            if (orderIds.length > 0) {
                //the link is set in a hidden input field generated in vqmod_wd_dymo.xml
                var link = $('input#wddymo-link').val();
                $.post(link, {
                        selected: orderIds
                    }
                ).done(function (data) {
                    var addresses = JSON.parse(data);
                    if (addresses.length == 0) {
                        console.log("Did not receive any order data")
                    } else {
                        $.each(addresses, function (index, address) {
                            setAddress(address);
                            //Dymo label SDK function
                            label.print(mainPrinter.name);
                        });
                    }
                }, "json");
            }
        }
    }

    /**
     * Sets the address of the .label file.
     * @param string address The address
     * @returns {*}
     */
    function setAddress(address) {
        if (!label || label.getAddressObjectCount() == 0) {
            return;
        }
        //Dymo label SDK function
        return label.setAddressText(0, address);
    }
});
