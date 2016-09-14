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
    function Driver(name, os, type, physical) {
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
    var Types = {}, OS = {};
    Object.defineProperties(Types, {
        "PIXEL": { value: 1 },
        "RAW": { value: 2 },
        "BOTH": { value: 4 }
    });
    Object.defineProperties(OS, {
        "MAC": { value: 1 },
        "LINUX": { value: 2 },
        "WINDOWS": { value: 4 }
    });

    //usb device mapping
    function Vendor(name, type, vendor, product, device, endpoint) {
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

    var internal = {

        printDrivers: [
            new Driver('UNKNOWN', null, Types.PIXEL, true),

            /** Mac File Printers */
            new Driver('PDFwriter.PPD', OS.MAC, Types.PIXEL, false),
            new Driver('vipriser.PPD', OS.MAC, Types.PIXEL, false),
            new Driver('PSCOLOR.PPD', OS.MAC, Types.PIXEL, false),

            /** Linux File Printers */
            new Driver('CUPS-PDF.PPD', OS.LINUX, Types.PIXEL, false),
            new Driver('Zebra-EPL1-Label.ppd', OS.LINUX, Types.BOTH, true),
            new Driver('Zebra-EPL2-Label.ppd', OS.LINUX, Types.BOTH, true),
            new Driver('Zebra-ZPL-Label.ppd', OS.LINUX, Types.BOTH, true),

            /** Windows File Printers */
            new Driver('Microsoft XPS Document Writer', OS.WINDOWS, Types.PIXEL, false),
            new Driver('Microsoft Print To PDF', OS.WINDOWS, Types.PIXEL, false),
            new Driver('Send to Microsoft OneNote', OS.WINDOWS, Types.PIXEL, false),
            new Driver('PDFCreator', OS.WINDOWS, Types.PIXEL, false),
            new Driver('PrimoPDF', OS.WINDOWS, Types.PIXEL, false),
            new Driver('CutePDFWriter', OS.WINDOWS, Types.PIXEL, false),
            new Driver('Bullzip PDF', OS.WINDOWS, Types.PIXEL, false),
            new Driver('Adobe PDF', OS.WINDOWS, Types.PIXEL, false),
            new Driver('doPDF', OS.WINDOWS, Types.PIXEL, false),
            new Driver('novaPDF', OS.WINDOWS, Types.PIXEL, false),
            new Driver('OPTIsend', OS.WINDOWS, Types.PIXEL, false),
            new Driver('pdf995', OS.WINDOWS, Types.PIXEL, false),
            new Driver('docPrint PDF', OS.WINDOWS, Types.PIXEL, false),
            new Driver('EmfPrinter', OS.WINDOWS, Types.PIXEL, false),
            new Driver('ColorPlus', OS.WINDOWS, Types.PIXEL, false),
            new Driver('ImageRight', OS.WINDOWS, Types.PIXEL, false),

            /** Windows Raw-Only Printers **/
            new Driver('Generic / Text Only', OS.WINDOWS, Types.RAW, true),

            /** Windows Dual-Mode Printers **/
            new Driver('ZDesigner', OS.WINDOWS, Types.BOTH, true),
            new Driver('EPSON TM', OS.WINDOWS, Types.BOTH, true),

            /** Mac Raw-Only Printers */
            new Driver('TEXTONLY.PPD', OS.MAC, Types.RAW, true),

            /** Mac Dual-Mode Printers */
            new Driver('TM-T88V.PPD', OS.MAC, Types.BOTH, true),

            /** Linux Raw-Only Printers */
            new Driver('TEXTONLY.PPD', OS.LINUX, Types.RAW, true),

            /** Linux Dual-Mode Printers */
            new Driver('EPTMBATH.PPD', OS.LINUX, Types.BOTH, true),
        ],

        usbVendors: [

            /** USB/HID Scales */
            new Vendor('Mettler Toledo', 'scale', '0x0EB8', '0xF000', '0x00', '0x81'),
            new Vendor('Dymo', 'scale', '0x0922', '0x8009', '0x00', '0x82'),
            new Vendor('Stamps.com', 'scale', '0x1446', '0x6A73', '0x00', '0x81'),

        ],

        ///// PRIVATE METHODS /////

        parseConst: function(strVal) {
            var upp = strVal.toUpperCase();

            if (Types[upp]) { return Types[upp]; }
            if (OS[upp]) { return OS[upp]; }

            return null;
        },

        findPrintDriver: function(driverName) {
            for(var i = 0; i < internal.printDrivers.length; i++) {
                var driver = internal.printDrivers[i];
                if (driver.name.toUpperCase() === driverName.toUpperCase()
                        || driverName.toUpperCase().indexOf(driver.name.toUpperCase()) > -1) {
                    return driver;
                }
            }

            return internal.printDrivers[0];
        },

        findUsbVendor: function(vendorId, productId) {
            //TODO
        },

        filter: {
            //loop through matching drivers for every item still in the list and remove if it matches the filter (bit matching)
            type: function(list, param, value) {
                for(var i = list.length - 1; i >= 0; i--) {
                    var item = list[i];
                    var driver = internal.findPrintDriver(item.driver);

                    if (driver && (driver[param] == value || (driver[param] & value) > 0)) {
                        list.splice(i, 1);
                    }
                }
            },

            //look for printer style filters
            printers: function(list, filter) {
                if (filter.type !== undefined) { internal.filter.type(list, 'type', filter.type); }
                if (filter.physical !== undefined) { internal.filter.type(list, 'physical', filter.physical); }
                if (filter.os !== undefined) {
                    if (typeof filter.os === 'boolean') {
                        var appVersion = '';

                        if (typeof(window.navigator) !== 'undefined') {
                            appVersion = window.navigator.appVersion;

                            var found;
                            if (appVersion('Mac') != -1) {
                                found = OS.MAC;
                            } else if (appVersion.indexOf('Linux') != -1 || appVersion.indexOf('X11') != -1) {
                                found = OS.LINUX;
                            } else {
                                found = OS.WINDOWS;
                            }

                            if (filter.os === false) { found = ~found; }
                            filter.os = found;
                        } else {
                            console.warn("Sifter cannot determine os; os filtering disabled");
                            filter.os = null;
                        }
                    }

                    internal.filter.type(list, 'os', filter.os);
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
                //TODO - name, type, vendor, product, device, endpoint
            }
        }

    };

    ///// PUBLIC DATA MAPPING /////

    // TODO: jsDocs for the Sifter class
    var sift = {

        /**
         * Will filter out only items that match specified filter.
         * TODO - docs
         *
         * @param list
         * @param filters
         * @returns {Array} The filtered list
         */
        toss: function(list, filters) {
            if (!list || list.length == 0) { return list; }
            var alter = list.slice();

            for(var key in filters) {
                if (filters.hasOwnProperty(key)) {
                    if (typeof filters[key] === 'string') {
                        var result = internal.parseConst(filters[key]);
                        if (result) { filters[key] = result; }
                    }
                }
            }

            if (alter[0].driver !== undefined) {
                internal.filter.printers(alter, filters);
            } else if (alter[0].vendor !== undefined) {
                internal.filter.usb(alter, filters);
            } else {
                throw new Error("Cannot determine list's element type");
            }

            return alter;
        },

        /**
         * Will filter out any items that do not match the specified filter.
         * TODO - docs
         *
         * @param list
         * @param filters
         * @returns {Array} The filtered list
         */
        keep: function(list, filters) {
            //to keep these filters we need to toss everything that isn't, so flip all the filters and call .toss()
            for(var key in filters) {
                if (filters.hasOwnProperty(key)) {
                    if (typeof filters[key] === 'boolean') {
                        filters[key] = !filters[key];
                    } else if (typeof filters[key] === 'string') {
                        var result = internal.parseConst(filters[key]);
                        if (result) {
                            filters[key] = ~result;
                        } else {
                            filters[key] = '^((?!' + filters[key] + ').)*$'; //strings used as regex, flip to negative lookahead
                        }
                    } else {
                        filters[key] = ~filters[key];
                    }
                }
            }

            return sift.toss(list, filters);
        },

        parse: {
            /**
             * Parses scale reading from USB raw output
             *
             * @param data
             * @returns
             *
             * @memberOf sift.parse
             */
            scale: function(data) {
                var scale = {
                    status: { raw: 0x00, value: '' },
                    precision: { raw: 0x00, value: 0 },
                    units: { raw: 0x00, value: '' },
                    weight: { raw: 0x00, value: 0 },
                    toString: function() {
                        return this.weight.value + this.units.value + ' - ' + this.status.value;
                    }
                };


                // Filter erroneous data
                if (data.length < 4 || data.slice(2, 8).join('') === '000000000000') {
                    return scale;
                }

                // Get status
                scale.status.raw = parseInt(data[1], 16);
                var status = ['Unknown', 'Fault', 'Stable (Zero)', 'Busy', 'Stable', 'Underweight', 'Overweight', 'Calibrate', 'Tare'];
                scale.status.value = status[scale.status.raw];
                if (scale.status.value === undefined) {
                    scale.status.value = 'Unknown';
                }

                // Get precision
                scale.precision.raw = parseInt(data[3], 16);
                scale.precision.value = scale.precision.raw ^ -256; //unsigned to signed
                scale.precision.value = scale.precision.value == -256? 0:scale.precision.value; //xor on 0 causes issues

                // Get units
                scale.units.raw = parseInt(data[2], 16);
                switch(scale.units.raw) {
                    case 2:
                        scale.units.value = 'g';
                        break;
                    case 3:
                        scale.units.value = 'kg';
                        break;
                    case 11:
                        scale.units.value = 'oz';
                        break;
                    case 12:
                    default:
                        scale.units.value = 'lbs';
                }

                // Get weight
                var wData = data.slice(4).reverse();
                scale.weight.raw = parseInt(wData.join(''), 16);
                scale.weight.value *= Math.pow(10, scale.precision.value);
                scale.weight.value = scale.weight.toFixed(Math.abs(scale.precision.value));

                return scale;
            }
        },

        /**
         * Turn on or off sift debugging statements in the console.
         *
         * @param {boolean} active Whether debugging is enabled
         */
        debug: function(active) {
            internal.debug = active;
        }
    };

    //Setup constants
    Object.defineProperties(sift, {
        "Type": { value: Types },
        "OS": { value: OS }
    });

    return sift;

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
