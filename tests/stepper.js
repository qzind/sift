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
                element.innerHTML = type + ":  " + (typeof(o) !== 'string'? JSON.stringify(o):o);
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
                        if (index > -1 && item.details[key] === filtering.tossed[key]) {
                            err.not.push(item);
                        }
                        //if it's not in the filtered list, but it is suppose to be - throw an error
                        if (index === -1 && item.details[key] !== filtering.tossed[key]) {
                            err.was.push(item);
                        }
                    }
                }
            }

            if (filtering.kept) {
                for(key in filtering.kept) {
                    if (filtering.kept.hasOwnProperty(key)) {
                        //if it's in the filtered list, but it isn't suppose to be - throw an error
                        if (index > -1 && item.details[key] !== filtering.kept[key]) {
                            err.not.push(item);
                        }
                        //if it's not in the filtered list, but it is suppose to be - throw an error
                        if (index === -1 && item.details[key] === filtering.kept[key]) {
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
        /** Test results on printer formatted lists */
        printer: function() {

            var testData = [
                { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', details: { physical: true, type: 'pixel', named: false } },
                { name: 'PDFwriter', driver: 'PDFwriter.ppd', details: { physical: false, type: 'pixel', named: true } },
                { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', details: { physical: true, type: 'both', named: false } },
                { name: 'Epson TM88 IV', driver: 'Generic / Text Only', details: { physical: true, type: 'raw', named: false } },
                { name: 'PDF', driver: 'CUPS-PDF.PPD', details: { physical: false, type: 'pixel', named: true } }
            ];

            sift.debug(true);

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

            Stepper.checkStep('Remove "PDF" Printers', sift.toss(testData, { name: "PDF" }), { tossed: { named: true } });
            Stepper.checkStep('Keep "PDF" Printers', sift.keep(testData, { name: "PDF" }), { kept: { named: true } });

            //TODO ??
            // Stepper.checkStep('Remove Printers', sift.toss({ os: sift.OS.MAC }), ..);
            // Stepper.checkStep('Remove Printers', sift.toss({ os: sift.OS.LINUX }), ..);
            // Stepper.checkStep('Remove Printers', sift.toss({ os: sift.OS.WINDOWS }), ..);
        },

        /** Test results on usb formatted lists */
        usb: function() {
            //TODO
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
