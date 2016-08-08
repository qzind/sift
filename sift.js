'use strict';

/**
 * @version 1.0.0
 * @overview Sift JavaScript Filter
 * <p/>
 * A JavaScript helper which filters hardware data for locally attached computer hardware.
 */

var sift = (function() {

    var DEBUG = false;

    var _sift = {

        ///// PRIVATE DATA MAPPING /////

        printDrivers: [

        /** Mac File Printers */
            {name: 'PDFwriter.ppd', os: 'mac', type: 'pixel', physical: false},
            {name: 'Print_to_VipRiser.ppd', os: 'mac', type: 'pixel', physical: false},
            {name: 'Virtual_PDF_Printer.ppd', os: 'mac', type: 'pixel', physical: false},

        /** Linux File Printers */
            {name: 'PDF.ppd', os: 'linux', type: 'pixel', physical: false},

        /** Windows File Printers */
            {name: 'Microsoft XPS Document Writer', os: 'windows', type: 'pixel', physical: false},
            {name: 'Microsoft Print To PDF', os: 'windows', type: 'pixel', physical: false},
            {name: 'Send to Microsoft OneNote', os: 'windows', type: 'pixel', physical: false},
            {name: 'PDFCreator', os: 'windows', type: 'pixel', physical: false},
            {name: 'PrimoPDF', os: 'windows', type: 'pixel', physical: false},
            {name: 'CutePDFWriter', os: 'windows', type: 'pixel', physical: false},
            {name: 'Bullzip PDF', os: 'windows', type: 'pixel', physical: false},
            {name: 'Adobe PDF', os: 'windows', type: 'pixel', physical: false},
            {name: 'doPDF', os: 'windows', type: 'pixel', physical: false},
            {name: 'novaPDF', os: 'windows', type: 'pixel', physical: false},
            {name: 'OPTIsend', os: 'windows', type: 'pixel', physical: false},
            {name: 'pdf995', os: 'windows', type: 'pixel', physical: false},
            {name: 'docPrint PDF', os: 'windows', type: 'pixel', physical: false},
            {name: 'EmfPrinter', os: 'windows', type: 'pixel', physical: false},
            {name: 'ColorPlus', os: 'windows', type: 'pixel', physical: false},
            {name: 'ImageRight', os: 'windows', type: 'pixel', physical: false},

        /** Windows Raw-Only Printers **/
            {name: 'Generic / Text Only', os: 'windows', type: 'raw', physical: true},

        /** Windows Dual-Mode Printers **/
            {name: 'ZDesigner', os: 'windows', type: 'both', physical: true},
            {name: 'EPSON TM', os: 'windows', type: 'both', physical: true},

        /** Mac Raw-Only Printers */
         //   {name: 'FIXME', os: 'mac', type: 'raw', physical: true},

        ],

        usbVendors: [

        /** USB/HID Scales */
            {name: 'Mettler Toledo', class: 'scale', vendor: '0x0EB8', product: '0xF000', device: '0x00', endpoint: '0x81'},
            {name: 'Dymo', class: 'scale', vendor: '0x0922', product: '0x8009', device: '0x00', endpoint: '0x82'},
            {name: 'Stamps.com', class: 'scale', vendor: '0x1446', product: '0x6A73', device: '0x00', endpoint: '0x81'},

        ],

        ///// PRIVATE METHODS /////

        /** Parses scale reading from USB raw output */
        parseScaleData: function (data) {
            var weight = {
                raw: null, value: null, toString: function () {
                    return weight.value;
                },
                units: {
                    raw: null, value: null, toString: function () {
                        return weight.units.value;
                    }
                },
                status: {
                    raw: null, value: null, toString: function () {
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
            switch (weight.status.raw) {
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
            weight.precision = weight.precision == -256 ? 0 : weight.precision; //xor on 0 causes issues

            // Get units
            weight.units.raw = parseInt(data[2], 16);
            switch (weight.units.raw) {
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
        },


    };

    ///// SIFTER CLASS ////
    // TODO: jsDocs for the Sifter class
    function Sifter(type, options) {
        var KEEP_KEY = '_sift_keep';

        this.sift = function(data) {
            if (!options.keep && !options.toss) {
                console.warn("Invalid sift.  Must be { keep|toss: {...}}");
                return data;
            }

            var sifted = data;
            var params = options.keep || options.toss;
            var keepFlag = options.keep ? true : false;

            if (DEBUG) {
                console.log("Options provided:");
                console.log(options);
                console.log("Original data:");
                console.log(data);
            }

            var debug = function(item, rule) {
                if (DEBUG) {
                    console.log("Marking " + type.toLowerCase() + " as " + (keepFlag ? "keep:" : "toss:"));
                    console.log(item);
                    console.log("matching data:");
                    console.log(rule);
                }
            };

            var osDetected;
            if (params.os) {
                var appVersion = '';

                if (typeof(params.os) === 'string') appVersion = params.os;
                else if (typeof(window.navigator) !== 'undefined') appVersion = window.navigator.appVersion;
                else console.warn("Sifter cannot determine os; os filtering disabled");

                if (appVersion('Mac')!=-1) osDetected = 'mac';
                else if (appVersion.indexOf('X11')!=-1) osDetected = 'linux';
                else if (appVersion.indexOf('Linux')!=-1) osDetected = 'linux';
                else osDetected = 'windows';
            }

            ///// PRINTERS /////
            if (type == 'PRINT') {
                // FIXME - This logic is broken.  We need loop through and mark all non-virtuals as physicals an all non-raw as pixel
                for (var i = 0; i < _sift.printDrivers.length; i++) {
                    for (var j = 0; j < sifted.length; j++) {
                        // Determine if the driver name matches
                        var driverMatch = sifted[j].driver && sifted[j].driver.toLowerCase().indexOf(_sift.printDrivers[i].name.toLowerCase()) !== -1;

                        // Toss or keep virtual/file printers (physical: true|false)
                        if (params.physical !== undefined) {
                            // if keep && physical or toss && virtual
                            if (params.physical === keepFlag) {
                                if (driverMatch) {
                                    sifted[j][KEEP_KEY] = false; // Mark virtual printers for removal
                                    debug(sifted[j], _sift.printDrivers[i]);
                                }
                            } else {
                                if (!driverMatch) {
                                    sifted[j][KEEP_KEY] = false; // Mark physical printers for removal
                                    debug(sifted[j], _sift.printDrivers[i]);
                                }
                            }
                        }

                        // FIXME This appears to be broken
                        // Toss or keep raw/pixel printers (type: 'pixel'|'raw'|'both')
                        if (params.type !== undefined) {
                            params.type = params.type.toLowerCase();
                            var typeMatch = driverMatch && (_sift.printDrivers[i].type === params.type || _sift.printDrivers[i].type === 'both');

                            if (typeMatch) {
                                console.log(sifted[j].name + " " + _sift.printDrivers[i].type + " matches " + params.type);
                            }

                            if (typeMatch === !keepFlag) {
                                sifted[j][KEEP_KEY] = false;
                                debug(sifted[j], _sift.printDrivers[i]);
                            }
                        }

                        // Enforce strict os matching based on windows.navigator or provided User Agent String
                        if (osDetected) {
                            var osMatch = driverMatch && (_sift.printDrivers[i].os === osDetected);
                            if (osMatch === !keepFlag) {
                                sifted[j][KEEP_KEY] = false;
                                debug(sifted[j], _sift.printDrivers[i]);
                            }
                        }
                    }
                }
            }

            ///// USB/HID /////
            if (type === 'USB') {
                for (var i = 0; i < _sift.usbVendors; i++) {
                    for (var j = 0; j < sifted.length; j++) {
                        // TODO Filter for hardware type (scales) and partial vendor name matching
                        throw "USB filtering not implemented";
                    }
                }
            }

            // Process results
            for (var i = sifted.length -1; i >= 0 ; i--) {
                var keep = sifted[i][KEEP_KEY]; // cache flag and remove it
                delete sifted[i][KEEP_KEY];
                if (keep === false) {
                    sifted.splice(i, 1);
                }
            }

            if (DEBUG) {
                console.log("Sifted data:");
                console.log(sifted);
            }

            return sifted;

        }
    }

    ///// PUBLIC METHODS /////

    /**
     * @namespace sift
     * @typedef {Object} Sifter
     *
     */
    return {
        /**
         * Returns a filtered printer listing, based on the filter provided
         * @param {Array<Object>} [all] List of printer objects to filter
         *  @param {string} [all.driver='Generic / Text Only'] Driver name retured from the OS
         *  @param {number} [all.dpi=600] Printer density, in dots per inch
         * @param {Object} [keep] Filter options
         *  @param {Sifter|Array<Sifter>}
         * @returns {Array<Object>}
         * TODO: Finish documentation
         *
         * @memberof sift.printers
         */
        printers: function(all, options) {
            return new Sifter('PRINT', options).sift(all);
        },

        usb: function(all, options) {
            return new Sifter('USB', options).sift(all);
        },

        setDebug: function(debug) {
            DEBUG = debug;
        }
    }

})();

(function() {
    if (typeof define === 'function' && define.amd) {
        define(sift);
    } else if (typeof exports === 'object') {
        module.exports = sift;
    } else {
        window.sift = sift;
    }
})();
