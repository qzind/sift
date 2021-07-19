'use strict';

/**
 * @version 1.0.2
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

    //mac address
    var macCalls = {
        nonBurnedAddressMasks: [], //populated by constructor calls

        burned: function(address) {
            if (address === 'UNKNOWN') { return true; }
            if (!address) { return false; }

            var plain = macCalls.plain(address);

            for(var i = 0; i < macCalls.nonBurnedAddressMasks.length; i++) {
                if (plain.indexOf(macCalls.nonBurnedAddressMasks[i]) == 0) {
                    return false;
                }
            }

            //second insignificant bit of first octet is zero per IEEE 802
            return parseInt(plain.substring(0, 2), 16).toString(2).slice(-8).substring(6, 7) == '0';
        },

        plain: function(address) {
            return (address || "").replace(/[^A-Fa-f0-9]/g, "").toUpperCase();
        }
    };

    function Mac(address, isVM, isBurnMask) {
        function _prop(val) { return { value: val, enumerable: true }; }

        if (isBurnMask) {
            macCalls.nonBurnedAddressMasks.push(address);
        }

        Object.defineProperties(this, {
            "mac": _prop(macCalls.plain(address)),
            "vmGuest": _prop(isVM),
            "burnedIn": _prop(macCalls.burned(address))
        });
    }


    //filter properties (NOTE: uses single bit values so .keep() filters can just be flipped)

    //printer
    var Types = {}, OS = {};
    Object.defineProperties(Types, {
        "PIXEL": { value: 1 },
        "RAW": { value: 2 },
        "BOTH": { value: 4 }
    });
    Object.defineProperties(OS, {
        "MAC": { value: 1 },
        "LINUX": { value: 2 },
        "WINDOWS": { value: 4 },
        "ANY": { value: -8 } //negative sum of previous bits
    });


    var internal = {

        printDrivers: [
            new Driver('UNKNOWN', OS.ANY, Types.PIXEL, true), //Default

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
            new Vendor('Fairbanks', 'scale', '0x0B67', '0x555E', '0x00', '0x81'),
            new Vendor('Dymo', 'scale', '0x0922', '0x8009', '0x00', '0x82'),
            new Vendor('Stamps.com', 'scale', '0x1446', '0x6A73', '0x00', '0x81'),

        ],

        networkAdapters: [
            new Mac('UNKNOWN', false), //Default

            new Mac(null, false),

            /** Burned-in masks need declared first for calculations on later addresses to succeed */
            new Mac('00-00-00-00-00-00-00-E0', false, true),

            /** VMWare */
            new Mac('00-50-56-', true, false),
            new Mac('00-0C-29-', true, false),
            new Mac('00-05-69-', true, false),

            /** Microsoft */
            new Mac('00-03-FF-', true, false),

            /** Parallells */
            new Mac('00-1C-42-', true, false),

            /** Xen, VBox */
            new Mac('00-0F-4B-', true, false),
            new Mac('00-16-3E-', true, false),
            new Mac('08-00-27-', true, false),
        ],

        ///// PRIVATE METHODS /////

        parseConst: function(strVal) {
            var upp = strVal.toUpperCase();

            if (Types[upp]) { return Types[upp]; }
            if (OS[upp]) { return OS[upp]; }

            return null;
        },

        match: {
            printDriver: function(driverName) {
                for(var i = 1; i < internal.printDrivers.length; i++) {
                    var driver = internal.printDrivers[i];
                    if (driver.name.toUpperCase() === driverName.toUpperCase()
                            || driverName.toUpperCase().indexOf(driver.name.toUpperCase()) > -1) {
                        return driver;
                    }
                }

                return internal.printDrivers[0];
            },

            usbVendor: function(vendorId, productId) {
                //TODO
            },

            addressScheme: function(address) {
                var plainAddress = macCalls.plain(address);

                for(var i = 1; i < internal.networkAdapters.length; i++) {
                    var adapter = internal.networkAdapters[i];
                    if (adapter.mac === plainAddress || (adapter.mac && plainAddress.indexOf(adapter.mac) == 0)) {
                        return adapter;
                    }
                }

                return internal.networkAdapters[0];
            }
        },

        filter: {
            out: {
                //true if found match's param equals the filter value (bit matching)
                thisOne: function(match, param, value) {
                    return (match && (match[param] == value || (match[param] & value) > 0));
                },

                //loop through matching drivers for every item still in the list and remove matches
                printers: function(list, param, value) {
                    for(var i = list.length - 1; i >= 0; i--) {
                        if (internal.filter.out.thisOne(internal.match.printDriver(list[i].driver), param, value)) {
                            list.splice(i, 1);
                        }
                    }
                },

                usbs: function(list, param, value) {
                    //TODO
                },

                addresses: function(list, param, value) {
                    for(var i = list.length - 1; i >= 0; i--) {
                        if (internal.filter.out.thisOne(internal.match.addressScheme(list[i].mac), param, value)) {
                            list.splice(i, 1);
                        }
                    }
                }
            },


            //look for printer style filters
            printers: function(list, filter) {
                if (filter.type !== undefined) { internal.filter.out.printers(list, 'type', filter.type); }
                if (filter.physical !== undefined) { internal.filter.out.printers(list, 'physical', filter.physical); }
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

                    internal.filter.out.printers(list, 'os', filter.os);
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
            },

            //look for address style filters
            address: function(list, filter) {
                if (filter.burnedIn !== undefined) { internal.filter.out.addresses(list, 'burnedIn', filter.burnedIn); }
                if (filter.vmGuest !== undefined) { internal.filter.out.addresses(list, 'vmGuest', filter.vmGuest); }
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
            } else if (alter[0].primary !== undefined) {
                internal.filter.address(alter, filters);
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
                    valid: true,
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
                    scale.valid = false;
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
                scale.weight.value = scale.weight.raw * Math.pow(10, scale.precision.value);
                scale.weight.value = scale.weight.value.toFixed(Math.abs(scale.precision.value));

                return scale;
            },

            /**
             * Parses MAC address to determine if it is burned in
             *
             * @param address
             *
             * @memberOf sift.parse
             */
            burnedMac: macCalls.burned
        },

        format: {
            /**
             * Formats plain MAC address to a readable form (ie. 00:00:00:00:00:00)
             *
             * @param address
             *
             * @memberOf sift.format
             */
            prettyMac: function(address) {
                //call plain() to ensure consistent results regardless of address format passed
                var clean = macCalls.plain(address);

                if (clean === '') {
                    return address; //if clean is empty, this is a bad address - just return what was passed
                } else {
                    return clean.match(/.{1,2}/g).join(':');
                }
            },

            /**
             * Formats MAC address to remove any special formatting
             *
             *  @param address
             *
             *  @memberOf sift.format
             */
            plainMac: macCalls.plain
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
