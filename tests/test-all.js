'use strict';

/**
 * @overview Sift tests for Node.js
 */

global.sift = require('../sift.js');
var Stepper = require('./stepper.js');

Stepper.tests.printer();
Stepper.tests.usb();