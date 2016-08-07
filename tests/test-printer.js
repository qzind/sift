'use strict';

/** Log directly to browser window, if available **/
if (typeof(document.body) !== 'undefined' && document.body) {
    var display = {
        log : function(o) {
            var element = document.createElement('pre');
            element.innerHTML = typeof(o) !== 'string' ? JSON.stringify(o) : o;
            document.body.appendChild(element);
            console.log(o);
        },
        warn: function(o) {
            var element = document.createElement('pre');
            element.innerHTML = "WARN:  " + typeof(o) !== 'string' ? JSON.stringify(o) : o;
            document.body.appendChild(element);
            console.warn(o);
        },
        error: function(o) {
            var element = document.createElement('pre');
            element.innerHTML = "ERROR:  " + typeof(o) !== 'string' ? JSON.stringify(o) : o;
            document.body.appendChild(element);
            console.error(o);
        }
    }
}

sift.printerTest = function() {

    ////// STEP 1 //////
    step.id++;
    step.name = "Remove Virtual File Printers";
    data = [
        { name: 'PDFwriter', driver: '/private/etc/cups/ppd/PDFwriter.ppd', filtered: true},
        { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', filtered: true},
        { name: 'PDF', driver: 'PDF.ppd', filtered: true},
        { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', filtered: false},
    ];

    data = sift.printers(data, { toss: { physical: false }});

    // Verify results against data
    for (var i = 0; i < data.length; i++) {
        if (data[i].filtered) {
            fail(step, data[i]);
        }
    }

    pass(step);

    ////// STEP 2 //////

    step.id++;
    step.name = "Remove Physical File Printers";
    data = [
        { name: 'PDFwriter', driver: '/private/etc/cups/ppd/PDFwriter.ppd', filtered: false},
        { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', filtered: false},
        { name: 'PDF', driver: 'PDF.ppd', filtered: false},
        { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', filtered: true},
    ];

    data = sift.printers(data, { toss: { physical: true }});

    // Verify results against data
    for (var i = 0; i < data.length; i++) {
        if (data[i].filtered) {
            fail(step, data[i]);
        }
    }

    pass(step);

    ////// STEP 3 //////

    step.id++;
    step.name = "Remove Non-Raw Printers";
    data = [
        { name: 'PDFwriter', driver: '/private/etc/cups/ppd/PDFwriter.ppd', filtered: true},
        { name: 'ZDesigner LP2844', driver: 'ZDesigner LP 2844.ppd', filtered: false},
        { name: 'PDF', driver: 'PDF.ppd', filtered: true},
        { name: 'HP Color LaserJet 2500', driver: 'HP Color LaserJet 2500 PS Class Driver', filtered: true},
    ];

    data = sift.printers(data, { toss: { pixel: true }});

    // Verify results against data
    for (var i = 0; i < data.length; i++) {
        if (data[i].filtered) {
            fail(step, data[i]);
        }
    }

    pass(step);


}

////// HELPERS //////

var step = { id: 0, name: null}, data;

var fail = function(_step, _data) {
    var err = 'FAILED on step ' + step.id + ' in "' + step.name + '".  Data:\n' + JSON.stringify(_data);
    display.error(err);
    throw err;
}

var pass = function(_step) {
    display.log('PASS on step ' + step.id + ' in "' + step.name + '"');
}