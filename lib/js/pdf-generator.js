/* jshint esversion: 6 */

/**
 * Simply a starter point for your app's utility functions.
 * Currently contains:
 * 		Util.notify(title, msg)
 */

// NODE MODULES
const electron = require('electron');
const moment = require('moment');
const fs = require('fs');
const pdf = require('html-pdf');

// CONSTRUCTOR
var PDFGenerator = function(creator) {
    // default string messages, feel free to add/modify/remove
    this.UNDERCONSTRUCTION = 'This feature is still under construction.';
    this.WHOOPS = 'Whoops! Something went wrong...';
    // keep track of who made you
    this.creator = creator;
    // console.log('Util initialized');
};

/**
 * Get a template file from the 'templates' dir
 * @param  {String}   filename The name and extension of the file
 * @param  {Function} callback What to do with the html
 * @return {Function}          callback
 */
PDFGenerator.prototype.generatePdf = function () {
    var html = fs.readFileSync('./lib/js/views/main/test.html', 'utf8');
    // var options = { format: 'Letter' };
    var options = { height: '13in', width: '8.5in' };
        
    pdf.create(html, options).toFile('./lib/js/views/main/test.pdf', function(err, res) {
        if (err) return console.log(err);
        console.log(res); // { filename: '/app/businesscard.pdf' }
        
    });
};

// Export the Util constructor from this module.
module.exports = PDFGenerator;
