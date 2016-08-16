'use strict';

/**
 * @version 1.0.0
 * @overview Sift JavaScript Filter
 * <p/>
 * A JavaScript helper which filters hardware data for locally attached computer hardware.
 */

var Sifter = (function() {

    ///// PRIVATE DATA MAPPING /////

    //printer driver mapping
    function _Driver(name, os, type, physical) {
        //properties will be visible, but uneditable
        function _prop(val) { return { value: val, enumerable: true }; }

        Object.defineProperties(this, {
            "name": _prop(name),
            "os": _prop(os),
            "type": _prop(type),
            "physical": _prop(physical)
        });
    }

    //printer filter properties (NOTE: uses single bit values so .keep() filters can just be flipped)
    var _Types = {}, _OS = {};
    Object.defineProperties(_Types, {
        "PIXEL": { value: 1 },
        "RAW": { value: 2 },
        "BOTH": { value: 4 }
    });
    Object.defineProperties(_OS, {
        "MAC": { value: 1 },
        "LINUX": { value: 2 },
        "WINDOWS": { value: 4 }
    });

    //usb device mapping
    function _Vendor(name, type, vendor, product, device, endpoint) {
        //properties will be visible, but uneditable
        function _prop(val) { return { value: val, enumerable: true }; }

        Object.defineProperties(this, {
            "name": _prop(name),
            "type": _prop(type),
            "vendor": _prop(vendor),
            "product": _prop(product),
            "device": _prop(device),
            "endpoint": _prop(endpoint)
        });
    }

    var _sift = {

        printDrivers: [
            new _Driver('UNKNOWN', null, _Types.PIXEL, true),

            /** Mac File Printers */
            new _Driver('PDFwriter.PPD', _OS.MAC, _Types.PIXEL, false),
            new _Driver('vipriser.PPD', _OS.MAC, _Types.PIXEL, false),
            new _Driver('PSCOLOR.PPD', _OS.MAC, _Types.PIXEL, false),

            /** Linux File Printers */
            new _Driver('CUPS-PDF.PPD', _OS.LINUX, _Types.PIXEL, false),

            /** Windows File Printers */
            new _Driver('Microsoft XPS Document Writer', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('Microsoft Print To PDF', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('Send to Microsoft OneNote', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('PDFCreator', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('PrimoPDF', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('CutePDFWriter', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('Bullzip PDF', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('Adobe PDF', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('doPDF', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('novaPDF', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('OPTIsend', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('pdf995', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('docPrint PDF', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('EmfPrinter', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('ColorPlus', _OS.WINDOWS, _Types.PIXEL, false),
            new _Driver('ImageRight', _OS.WINDOWS, _Types.PIXEL, false),

            /** Windows Raw-Only Printers **/
            new _Driver('Generic / Text Only', _OS.WINDOWS, _Types.RAW, true),

            /** Windows Dual-Mode Printers **/
            new _Driver('ZDesigner', _OS.WINDOWS, _Types.BOTH, true),
            new _Driver('EPSON TM', _OS.WINDOWS, _Types.BOTH, true),

            /** Mac Raw-Only Printers */
            new _Driver('TEXTONLY.PPD', _OS.MAC, _Types.RAW, true),

            /** Mac Dual-Mode Printers */
            new Driver('TM-T88V.PPD', _OS.MAC, _Types.BOTH, true),

            /** Linux Raw-Only Printers */
            new _Driver('TEXTONLY.PPD', _OS.LINUX, _Types.RAW, true),

            /** Linux Dual-Mode Printers */
            new Driver('EPTMBATH.PPD', _OS.LINUX, _Types.BOTH, true),
        ],

        usbVendors: [

            /** USB/HID Scales */
            new _Vendor('Mettler Toledo', 'scale', '0x0EB8', '0xF000', '0x00', '0x81'),
            new _Vendor('Dymo', 'scale', '0x0922', '0x8009', '0x00', '0x82'),
            new _Vendor('Stamps.com', 'scale', '0x1446', '0x6A73', '0x00', '0x81'),

        ],

        ///// PRIVATE METHODS /////

        findPrintDriver: function(driverName) {
            for(var i = 0; i < _sift.printDrivers.length; i++) {
                var driver = _sift.printDrivers[i];
                if (driver.name.toUpperCase() === driverName.toUpperCase()
                        || driverName.toUpperCase().indexOf(driver.name.toUpperCase()) > -1) {
                    return driver;
                }
            }

            return _sift.printDrivers[0];
        },

        findUsbVendor: function() {
            //TODO
        },

        filter: {
            //loop through matching drivers for every item still in the list and remove if it matches the filter (bit matching)
            type: function(list, param, value) {
                for(var i = list.length - 1; i >= 0; i--) {
                    var item = list[i];
                    var driver = _sift.findPrintDriver(item.driver);

                    if (driver && (driver[param] == value || (driver[param] & value) > 0)) {
                        list.splice(i, 1);
                    }
                }
            },

            //look for printer style filters
            printers: function(list, filter) {
                if (filter.type !== undefined) { _sift.filter.type(list, 'type', filter.type); }
                if (filter.physical !== undefined) { _sift.filter.type(list, 'physical', filter.physical); }
                if (filter.os !== undefined) {
                    if (typeof filter.os === 'boolean') {
                        var appVersion = '';

                        if (typeof(window.navigator) !== 'undefined') {
                            appVersion = window.navigator.appVersion;

                            var found;
                            if (appVersion('Mac') != -1) {
                                found = _OS.MAC;
                            } else if (appVersion.indexOf('Linux') != -1 || appVersion.indexOf('X11') != -1) {
                                found = _OS.LINUX;
                            } else {
                                found = _OS.WINDOWS;
                            }

                            if (filter.os === false) { found = ~found; }
                            filter.os = found;
                        } else {
                            console.warn("Sifter cannot determine os; os filtering disabled");
                            filter.os = null;
                        }
                    }

                    _sift.filter.type(list, 'os', filter.os);
                }
                if (filter.name !== undefined) {
                    var regex = new RegExp(filter.name);
                    for(var i = list.length - 1; i >= 0; i--) {
                        if (list[i].driver.match(regex)) {
                            list.splice(i, 1);
                        }
                    }
                }
            },

            //look for usb style filters
            usb: function(list, filter) {
                //TODO
            }
        },

        /** Parses scale reading from USB raw output */
        parseScaleData: function(data) {
            var weight = {
                raw: null, value: null, toString: function() {
                    return weight.value;
                },
                units: {
                    raw: null, value: null, toString: function() {
                        return weight.units.value;
                    }
                },
                status: {
                    raw: null, value: null, toString: function() {
                        return weight.status.value;
                    }
                },
                precision: null,
            };

            // Filter erroneous data
            if (data.length < 4 || data.slice(2, 8).join('') === '000000000000') {
                return weight;
            }

            // Get status
            weight.status.raw = parseInt(data[1], 16);
            switch(weight.status.raw) {
                case 1: // fault
                case 5: // underweight
                case 6: // overweight
                case 7: // calibrate
                case 8: // re-zero
                    weight.status.value = 'Error';
                    break;
                case 3: // busy
                    weight.status.value = 'Busy';
                    break;
                case 2: // stable at zero
                case 4: // stable non-zero
                default:
                    weight.status.value = 'Stable';
            }

            // Get precision
            weight.precision = parseInt(data[3], 16);
            weight.precision = weight.precision ^ -256; //unsigned to signed
            weight.precision = weight.precision == -256? 0:weight.precision; //xor on 0 causes issues

            // Get units
            weight.units.raw = parseInt(data[2], 16);
            switch(weight.units.raw) {
                case 2:
                    weight.units.value = 'g';
                    break;
                case 3:
                    weight.units.value = 'kg';
                    break;
                case 11:
                    weight.units.value = 'oz';
                    break;
                case 12:
                default:
                    weight.units.value = 'lbs';
            }
            // Get weight
            data.splice(0, 4);
            data.reverse();
            weight.raw = parseInt(data.join(''), 16);
            weight.raw *= Math.pow(10, weight.precision);
            weight.raw = weight.toFixed(Math.abs(weight.precision));
            weight.value = weight + weight.units + ' - ' + status;
            return weight;
        }

    };

    ///// PUBLIC DATA MAPPING /////

    // TODO: jsDocs for the Sifter class
    function Sifter(format, list) {
        var _debug = true;

        //setup variables used on a per-instance basis
        Object.defineProperties(this, {
            //constants
            "format": { value: format, enumerable: true },

            //accessor
            "debug": { value: _debug, enumerable: true, writable: true },

            //data
            "originalList": { value: list },
            "filteredList": { value: list.slice(), enumerable: true, writable: true } //copy list to separate reference
        });
    }


    //Setup constants shared across all instances
    Object.defineProperties(Sifter, {
        "PRINT": { value: 0 },
        "USB": { value: 1 },

        "Type": { value: _Types },
        "OS": { value: _OS }
    });


    //Setup functions shared across all instances

    /**
     * Will filter out only items that match specified filter.
     *
     * @param filters TODO - docs
     * @returns {Sifter} Reference to self to allow chaining calls.
     */
    Sifter.prototype.toss = function(filters) {
        //noinspection FallThroughInSwitchStatementJS
        switch(this.format) {
            default:
                console.warn("Using unknown type '" + this.format + "' on Sifter instance. Defaulting to PRINT");
            case Sifter.PRINT:
                _sift.filter.printers(this.filteredList, filters);
                break;
            case Sifter.USB:
                _sift.filter.usb(this.filteredList, filters);
                break;
        }

        return this;
    };

    /**
     * Will filter out any items that do not match the specified filter.
     *
     * @param filters TODO - docs
     * @returns {Sifter} Reference to self to allow chaining calls.
     */
    Sifter.prototype.keep = function(filters) {
        //to keep these filters we need to toss everything that isn't, so flip all the filters and call .toss()
        for(var key in filters) {
            if (filters.hasOwnProperty(key)) {
                if (typeof filters[key] === 'boolean') {
                    filters[key] = !filters[key];
                } else if (typeof filters[key] === 'string') {
                    filters[key] = '^((?!'+filters[key]+').)*$'; //strings used as regex, flip to negative lookahead
                } else {
                    filters[key] = ~filters[key];
                }
            }
        }

        return this.toss(filters);
    };

    /**
     * @returns {Array} Returned the list as filtered by any <code>keep</code> or <code>toss</code> calls.
     */
    Sifter.prototype.list = function() {
        return this.filteredList;
    };

    /**
     * Restore the Sifter's list back to its original collection.
     * @returns {Sifter} Reference to self to allow chaining calls.
     */
    Sifter.prototype.reset = function() {
        this.filteredList = this.originalList.slice();
        return this;
    };


    return Sifter;

})();

(function() {
    if (typeof define === 'function' && define.amd) {
        define(Sifter);
    } else if (typeof exports === 'object') {
        module.exports = Sifter;
    } else {
        window.sift = Sifter;
    }
})();
