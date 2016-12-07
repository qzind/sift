'use strict';

var Stepper = {
    /** Provides logging directly to browser window, if available */
    display: {
        log: function(o) { Stepper.display.display(o, 'INFO'); },
        warn: function(o) { Stepper.display.display(o, 'WARN'); },
        error: function(o) { Stepper.display.display(o, 'ERROR'); },
        display: function(o, type) {
            if (typeof(document) !== 'undefined') {
                var element = document.createElement('pre');
                element.innerHTML = (type? type + ":  ":"") + (typeof(o) !== 'string'? JSON.stringify(o):o);
                document.body.appendChild(element);
            }
            switch(type) {
                case 'INFO':
                    return console.info(o);
                case 'WARN':
                    return console.warn(o);
                case 'ERROR':
                    return console.error(o);
            }
        }
    },

    /** Provides tracking and checking of test steps */
    original: null,
    checkStep: function(name, filtered, filtering) {
        var err = { not: [], was: [] };

        for(var i = 0; i < Stepper.original.length; i++) {
            var item = Stepper.original[i];
            var index = filtered.indexOf(item);
            var key;

            if (filtering.tossed) {
                for(key in filtering.tossed) {
                    if (filtering.tossed.hasOwnProperty(key)) {
                        //if it's in the filtered list, but it isn't suppose to be - throw an error
                        if (index > -1 && filtering.tossed[key].indexOf(item.details[key]) > -1) {
                            err.not.push(item);
                        }
                        //if it's not in the filtered list, but it is suppose to be - throw an error
                        if (index === -1 && filtering.tossed[key].indexOf(item.details[key]) === -1) {
                            err.was.push(item);
                        }
                    }
                }
            }

            if (filtering.kept) {
                for(key in filtering.kept) {
                    if (filtering.kept.hasOwnProperty(key)) {
                        //if it's in the filtered list, but it isn't suppose to be - throw an error
                        if (index > -1 && filtering.kept[key].indexOf(item.details[key]) === -1) {
                            err.not.push(item);
                        }
                        //if it's not in the filtered list, but it is suppose to be - throw an error
                        if (index === -1 && filtering.kept[key].indexOf(item.details[key]) > -1) {
                            err.was.push(item);
                        }
                    }
                }
            }
        }

        if (err.not.length || err.was.length) {
            var errMsg = 'FAILED on step "' + name + '"';
            for(i = 0; i < err.not.length; i++) {
                errMsg += '\n\tItem not filtered: ' + JSON.stringify(err.not[i]);
            }
            for(i = 0; i < err.was.length; i++) {
                errMsg += '\n\tItem was filtered: ' + JSON.stringify(err.was[i]);
            }
            errMsg += '\n\tData: ' + JSON.stringify(filtered);

            Stepper.display.error(errMsg);
            throw err;
        } else {
            Stepper.display.log('PASS on step "' + name + '"');
        }
    },

    /** Performs actual testing */
    tests: {
        setup: function() {
            sift.debug(true);

            //temporary way of cleanly testing expected booleans along-side possible array contents
            Boolean.prototype.indexOf = function(val) {
                return (this === val? 1:-1);
            };
        },

        teardown: function() {
            sift.debug(false);

            //remove our prototype changes
            Boolean.prototype.indexOf = undefined;

            Stepper.display.display('<hr/>');
        },

        /** Test results on printer formatted lists */
        printer: function() {
            Stepper.tests.setup();
            Stepper.display.display('Starting Printer Tests');

            var testData = [
                {
                    name: 'HP Color LaserJet 2500',
                    driver: 'HP Color LaserJet 2500 PS Class Driver',
                    details: { physical: true, type: 'pixel', os: 'any', named: false }
                },
                { name: 'PDFwriter', driver: 'PDFwriter.ppd', details: { physical: false, type: 'pixel', os: 'mac', named: true } },
                { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', details: { physical: true, type: 'both', os: 'windows', named: false } },
                { name: 'Epson TM88 IV', driver: 'Generic / Text Only', details: { physical: true, type: 'raw', os: 'windows', named: false } },
                { name: 'PDF', driver: 'CUPS-PDF.PPD', details: { physical: false, type: 'pixel', os: 'linux', named: true } }
            ];
            Stepper.original = testData;


            Stepper.checkStep('Remove Virtual File Printers', sift.toss(testData, { physical: false }), { tossed: { physical: false } });
            Stepper.checkStep('Keep Virtual File Printers', sift.keep(testData, { physical: false }), { kept: { physical: false } });

            Stepper.checkStep('Remove Physical Printers', sift.toss(testData, { physical: true }), { tossed: { physical: true } });
            Stepper.checkStep('Keep Physical Printers', sift.keep(testData, { physical: true }), { kept: { physical: true } });


            Stepper.checkStep('Remove Pixel Only Printers', sift.toss(testData, { type: sift.Type.PIXEL }), { tossed: { type: 'pixel' } });
            Stepper.checkStep('Remove Pixel Only Printers String Test', sift.toss(testData, { type: 'pixel' }), { tossed: { type: 'pixel' } });
            Stepper.checkStep('Keep Pixel Only Printers', sift.keep(testData, { type: sift.Type.PIXEL }), { kept: { type: 'pixel' } });
            Stepper.checkStep('Keep Pixel Only Printers String Test', sift.keep(testData, { type: 'pixel' }), { kept: { type: 'pixel' } });

            Stepper.checkStep('Remove Raw Only Printers', sift.toss(testData, { type: sift.Type.RAW }), { tossed: { type: 'raw' } });
            Stepper.checkStep('Remove Raw Only Printers String Test', sift.toss(testData, { type: 'raw' }), { tossed: { type: 'raw' } });
            Stepper.checkStep('Keep Raw Only Printers', sift.keep(testData, { type: sift.Type.RAW }), { kept: { type: 'raw' } });
            Stepper.checkStep('Keep Raw Only Printers String Test', sift.keep(testData, { type: 'raw' }), { kept: { type: 'raw' } });

            Stepper.checkStep('Remove Dual Only Printers', sift.toss(testData, { type: sift.Type.BOTH }), { tossed: { type: 'both' } });
            Stepper.checkStep('Remove Dual Only Printers String Test', sift.toss(testData, { type: 'both' }), { tossed: { type: 'both' } });
            Stepper.checkStep('Keep Dual Only Printers', sift.keep(testData, { type: sift.Type.BOTH }), { kept: { type: 'both' } });
            Stepper.checkStep('Keep Dual Only Printers String Test', sift.keep(testData, { type: 'both' }), { kept: { type: 'both' } });


            Stepper.checkStep('Remove Windows Only Printers', sift.toss(testData, { os: sift.OS.WINDOWS }), { tossed: { os: 'windows' } });
            Stepper.checkStep('Remove Windows Only Printers String Test', sift.toss(testData, { os: 'windows' }), { tossed: { os: 'windows' } });
            Stepper.checkStep('Keep Any Windows Printers', sift.keep(testData, { os: sift.OS.WINDOWS }), { kept: { os: ['windows', 'any'] } });
            Stepper.checkStep('Keep Any Windows Printers String Test', sift.keep(testData, { os: 'windows' }), { kept: { os: ['windows', 'any'] } });

            Stepper.checkStep('Remove Linux Only Printers', sift.toss(testData, { os: sift.OS.LINUX }), { tossed: { os: 'linux' } });
            Stepper.checkStep('Remove Linux Only Printers String Test', sift.toss(testData, { os: 'linux' }), { tossed: { os: 'linux' } });
            Stepper.checkStep('Keep Any Linux Printers', sift.keep(testData, { os: sift.OS.LINUX }), { kept: { os: ['linux', 'any'] } });
            Stepper.checkStep('Keep Any Linux Printers String Test', sift.keep(testData, { os: 'linux' }), { kept: { os: ['linux', 'any'] } });

            Stepper.checkStep('Remove Mac Only Printers', sift.toss(testData, { os: sift.OS.MAC }), { tossed: { os: 'mac' } });
            Stepper.checkStep('Remove Mac Only Printers String Test', sift.toss(testData, { os: 'mac' }), { tossed: { os: 'mac' } });
            Stepper.checkStep('Keep Any Mac Printers', sift.keep(testData, { os: sift.OS.MAC }), { kept: { os: ['mac', 'any'] } });
            Stepper.checkStep('Keep Any Mac Printers String Test', sift.keep(testData, { os: 'mac' }), { kept: { os: ['mac', 'any'] } });


            Stepper.checkStep('Remove "PDF" Named Printers', sift.toss(testData, { name: "PDF" }), { tossed: { named: true } });
            Stepper.checkStep('Keep "PDF" Named Printers', sift.keep(testData, { name: "PDF" }), { kept: { named: true } });


            Stepper.tests.teardown();
        },

        /** Test results on usb formatted lists */
        usb: function() {
            //TODO
        },

        address: function() {
            Stepper.tests.setup();
            Stepper.display.display('Starting Address Tests');

            var testData = [
                {
                    mac: '00505600FFFF',
                    details: { burnedIn: false, vmGuest: true }
                },
                { mac: '00-16-3E-00-FF-FF', details: { burnedIn: false, vmGuest: true } },
                { mac: '02C01DC0FFEE', details: { burnedIn: true, vmGuest: false } },
                { mac: '4A:CC:E5:52:AB:ED', details: { burnedIn: true, vmGuest: false } },
                { mac: '00-00-00-00-00-00-00-E0', details: { burnedIn: false, vmGuest: false } }
            ];
            Stepper.original = testData;


            Stepper.checkStep('Remove Non-burned-in Addresses', sift.toss(testData, { burnedIn: false }), { tossed: { burnedIn: false } });
            Stepper.checkStep('Keep Non-burned-in Addresses', sift.keep(testData, { burnedIn: false }), { kept: { burnedIn: false } });

            Stepper.checkStep('Remove Burned-in Addresses', sift.toss(testData, { burnedIn: true }), { tossed: { burnedIn: true } });
            Stepper.checkStep('Keep Burned-in Addresses', sift.keep(testData, { burnedIn: true }), { kept: { burnedIn: true } });


            Stepper.checkStep('Remove VM Guest Addresses', sift.toss(testData, { vmGuest: true }), { tossed: { vmGuest: true } });
            Stepper.checkStep('Keep VM Guest Addresses', sift.keep(testData, { vmGuest: true }), { kept: { vmGuest: true } });

            Stepper.checkStep('Remove Non-VM Guest Addresses', sift.toss(testData, { vmGuest: false }), { tossed: { vmGuest: false } });
            Stepper.checkStep('Keep Non-VM Guest Addresses', sift.keep(testData, { vmGuest: false }), { kept: { vmGuest: false } });


            Stepper.tests.teardown();
        }
    }
};

(function() {
    if (typeof define === 'function' && define.amd) {
        define(Stepper);
    } else if (typeof exports === 'object') {
        module.exports = Stepper;
    } else {
        window.Stepper = Stepper;
    }
})();
