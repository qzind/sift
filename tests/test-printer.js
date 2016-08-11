'use strict';

var TestSuite = {
    /** Provides logging directly to browser window, if available */
    display: {
        log: function(o) { TestSuite.display.display(o, 'INFO'); },
        warn: function(o) { TestSuite.display.display(o, 'WARN'); },
        error: function(o) { TestSuite.display.display(o, 'ERROR'); },
        display: function(o, type) {
            var element = document.createElement('pre');
            element.innerHTML = type + ":  " + (typeof(o) !== 'string'? JSON.stringify(o):o);
            document.body.appendChild(element);
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
    stepper: {
        name: null, original: null, filtered: null, flag: 0,

        checkStep: function(name, filtered, filteredFlag) {
            TestSuite.stepper.name = name;
            TestSuite.stepper.filtered = filtered;
            TestSuite.stepper.flag = filteredFlag;

            TestSuite.stepper.validate();
        },

        validate: function() {
            var err = null;
            for(var i = 0; i < TestSuite.stepper.original.length; i++) {
                var item = TestSuite.stepper.original[i];
                var index = TestSuite.stepper.filtered.indexOf(item);

                console.log(index, (index == -1? 'X':'O'), '- FLAGS', TestSuite.stepper.flag, ' =?= ', TestSuite.stepper.flag & item.test);

                //if it's in the filtered list, but it isn't suppose to be - throw an error
                if (index > -1 && (TestSuite.stepper.flag & item.test) > 0) {
                    err = 'FAILED on step "' + TestSuite.stepper.name + '".' +
                            '\n\tItem not filtered: ' + JSON.stringify(item) +
                            '\n\tData: ' + JSON.stringify(TestSuite.stepper.filtered);
                    break;
                }
                //if it's not in the filtered list, but it is suppose to be - throw an error
                if (index == -1 && (TestSuite.stepper.flag & item.test) == 0) {
                    err = 'FAILED on step "' + TestSuite.stepper.name + '".' +
                            '\n\tItem was filtered: ' + JSON.stringify(item) +
                            '\n\tData: ' + JSON.stringify(TestSuite.stepper.filtered);
                    break;
                }
            }

            if (err) {
                TestSuite.display.error(err);
                throw err;
            } else {
                TestSuite.display.log('PASS on step "' + TestSuite.stepper.name + '"');
            }
        }
    },

    /** Performs actual testing */
    tests: {
        /** Test results on printer formatted lists */
        printer: function() {
            //test result filtering flags - active if entry should be removed after filter call
            var NONE = 0, REMOVE_VIRTUAL = 1, REMOVE_PHYSICAL = 2, REMOVE_PIXEL = 4, REMOVE_RAW = 8, REMOVE_BOTH = 16, REMOVE_NAME = 32, REMOVE_UNNAME = 64;

            var testData = [
                { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', test: REMOVE_PHYSICAL | REMOVE_PIXEL | REMOVE_UNNAME },
                { name: 'PDFwriter', driver: '/private/etc/cups/ppd/PDFwriter.ppd', test: REMOVE_VIRTUAL | REMOVE_PIXEL | REMOVE_NAME },
                { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', test: REMOVE_PHYSICAL | REMOVE_BOTH | REMOVE_UNNAME },
                { name: 'Epson TM88 IV', driver: 'Generic / Text Only', test: REMOVE_PHYSICAL | REMOVE_RAW | REMOVE_UNNAME },
                { name: 'PDF', driver: 'PDF.ppd', test: REMOVE_VIRTUAL | REMOVE_PIXEL | REMOVE_NAME }
            ];

            var siftPrinters = new Sifter(Sifter.PRINT, testData);
            siftPrinters.debug = true;
            // siftPrinters._dump();

            TestSuite.stepper.original = testData;
            TestSuite.stepper.checkStep('Initial setup', siftPrinters.list(), NONE);

            TestSuite.stepper.checkStep('Remove Virtual File Printers', siftPrinters.reset().toss({ physical: false }).list(), REMOVE_VIRTUAL);
            TestSuite.stepper.checkStep('Keep Virtual File Printers', siftPrinters.reset().keep({ physical: false }).list(), REMOVE_PHYSICAL);

            TestSuite.stepper.checkStep('Remove Physical Printers', siftPrinters.reset().toss({ physical: true }).list(), REMOVE_PHYSICAL);
            TestSuite.stepper.checkStep('Keep Physical Printers', siftPrinters.reset().keep({ physical: true }).list(), REMOVE_VIRTUAL);

            TestSuite.stepper.checkStep('Remove Pixel Only Printers', siftPrinters.reset().toss({ type: Sifter.Type.PIXEL }).list(), REMOVE_PIXEL);
            TestSuite.stepper.checkStep('Keep Pixel Only Printers', siftPrinters.reset().keep({ type: Sifter.Type.PIXEL }).list(), REMOVE_RAW | REMOVE_BOTH);

            TestSuite.stepper.checkStep('Remove Raw Only Printers', siftPrinters.reset().toss({ type: Sifter.Type.RAW }).list(), REMOVE_RAW);
            TestSuite.stepper.checkStep('Keep Raw Only Printers', siftPrinters.reset().keep({ type: Sifter.Type.RAW }).list(), REMOVE_BOTH | REMOVE_PIXEL);

            TestSuite.stepper.checkStep('Remove Dual Only Printers', siftPrinters.reset().toss({ type: Sifter.Type.BOTH }).list(), REMOVE_BOTH);
            TestSuite.stepper.checkStep('Keep Dual Only Printers', siftPrinters.reset().keep({ type: Sifter.Type.BOTH }).list(), REMOVE_PIXEL | REMOVE_RAW);

            TestSuite.stepper.checkStep('Remove "PDF" Printers', siftPrinters.reset().toss({ name: "PDF" }).list(), REMOVE_NAME);
            TestSuite.stepper.checkStep('Keep "PDF" Printers', siftPrinters.reset().keep({ name: "PDF" }).list(), REMOVE_UNNAME);

            //TODO ??
            // TestSuite.stepper.checkStep('Remove Printers', siftPrinters.reset().toss({ os: Sifter.OS.MAC }).list());
            // TestSuite.stepper.checkStep('Remove Printers', siftPrinters.reset().toss({ os: Sifter.OS.LINUX }).list());
            // TestSuite.stepper.checkStep('Remove Printers', siftPrinters.reset().toss({ os: Sifter.OS.WINDOWS }).list());

            TestSuite.stepper.checkStep('Final Clear', siftPrinters.reset().list(), NONE);
        },

        /** Test results on usb formatted lists */
        usb: function() {
            //TODO
        }
    }
};
