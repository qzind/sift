'use strict';

/** Log directly to browser window, if available **/
if (typeof(document.body) !== 'undefined' && document.body) {
    var display = {
        log: function(o) { display.display(o, 'INFO'); },
        warn: function(o) { display.display(o, 'WARN'); },
        error: function(o) { display.display(o, 'ERROR'); },
        display: function(o, type) {
            var element = document.createElement('pre');
            element.innerHTML = type + ":  " + (typeof(o) !== 'string' ? JSON.stringify(o) : o);
            document.body.appendChild(element);
            switch(type) {
                case 'INFO': return console.info(o);
                case 'WARN': return console.warn(o);
                case 'ERROR': return console.error(o);
            }
        }
    }
}

sift.printerTest = function() {

    ////// STEP 1 //////
    step.set("Remove Virtual File Printers", [
        { name: 'PDFwriter', driver: '/private/etc/cups/ppd/PDFwriter.ppd', filtered: true},
        { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', filtered: true},
        { name: 'PDF', driver: 'PDF.ppd', filtered: true},
        { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', filtered: false},
    ]);

    step.data = sift.printers(step.data, { toss: { physical: false }});
    step.validate();

    ////// STEP 2 //////
    step.set("Remove Physical File Printers", [
        { name: 'PDFwriter', driver: '/private/etc/cups/ppd/PDFwriter.ppd', filtered: false},
        { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', filtered: false},
        { name: 'PDF', driver: 'PDF.ppd', filtered: false},
        { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', filtered: true},
    ]);

    step.data = sift.printers(step.data, { toss: { physical: true }});
    step.validate();

    ////// STEP 3 //////
    step.set("Remove Pixel Printers", [
        { name: 'PDFwriter', driver: '/private/etc/cups/ppd/PDFwriter.ppd', filtered: true},
        { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', filtered: true},
        { name: 'Epson TM88 IV', driver: 'Generic / Text Only', filtered: false},
        { name: 'PDF', driver: 'PDF.ppd', filtered: true},
        { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', filtered: true},
    ]);

    step.data = sift.printers(step.data, { toss: { type: 'pixel' }});
    step.validate();

};

////// HELPERS //////

var step = {
    id: 0, name: null, data: null,
    set: function(name, data) { step.name = name; step.data = data; step.id++; },
    validate: function() {
        for (var i = 0; i < step.data.length; i++) {
            if (step.data[i].filtered) {
                fail(step, step.data[i]);
            }
        }
        pass(step);
    }
};

var fail = function(step) {
    var err = 'FAILED on step ' + step.id + ' in "' + step.name + '".  Data:\n' + JSON.stringify(step.data);
    display.error(err);
    throw err;
};

var pass = function(step) {
    display.log('PASS on step ' + step.id + ' in "' + step.name + '"');
};