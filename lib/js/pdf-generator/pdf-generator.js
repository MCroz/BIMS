/* jshint esversion: 6 */

/**
 * Simply a starter point for your app's utility functions.
 * Currently contains:
 * 		Util.notify(title, msg)
 */

// NODE MODULES
const electron = require('electron');
const Moment = require('moment');
const fs = require('fs');
const pdf = require('html-pdf');
const http = require('http');
const path = require('path');


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
PDFGenerator.prototype.generatePdf = function (type,data) {
    
    // var options = { format: 'Letter' };
    var options = { height: '13in', width: '8.5in' };
    var html;
    var html = fs.readFileSync('./lib/js/pdf-generator/BRGYClearance/brgyclearance.html', 'utf8');
    if (type == "Barangay Clearance") {
        html = fs.readFileSync('./lib/js/pdf-generator/BRGYClearance/brgyclearance.html', 'utf8');
        html = html.replace('{{brgyLogo}}', window.bims.imageLocations + 'buting-logo.jpg');
        html = html.replace('{{pasigLogo}}', window.bims.imageLocations + 'pasig-logo.jpg');
        html = html.replace('{{FullName}}', data.FirstName + " " + data.MiddleName + " " + data.LastName );
        html = html.replace('{{FullAddress}}', data.AddressNo + " " + data.AddressSt );
        html = html.replace('{{Date}}', Moment().format('Do') + " Day of " + Moment().format('MMMM') + ", " + Moment().format('YYYY') );
        html = html.replace('{{Purpose}}', data.Purpose);
        html = html.replace('{{Image}}', data.Image);
    }
    if (type == "Certificate of Indigency") {
        html = fs.readFileSync('./lib/js/pdf-generator/BRGYIndigency/brgyIngency.html', 'utf8');
        html = html.replace('{{brgyLogo}}', window.bims.imageLocations + 'buting-logo.jpg');
        html = html.replace('{{pasigLogo}}', window.bims.imageLocations + 'pasig-logo.jpg');
        html = html.replace('{{FullName}}', data.FirstName + " " + data.MiddleName + " " + data.LastName );
        html = html.replace('{{FullAddress}}', data.AddressNo + " " + data.AddressSt );
        html = html.replace('{{Date}}', Moment().format('Do') + " Day of " + Moment().format('MMMM') + ", " + Moment().format('YYYY') );
        html = html.replace('{{Purpose}}', data.Purpose);
        html = html.replace('{{Image}}', data.Image);
    }


    //Check if PDF Server is Initialized
    if (typeof (window.bims.pdfServer) != "undefined") {
        window.bims.pdfServer.close();
    }
    window.bims.pdfServer = http.createServer(function (req, res) {
        if (req.url === '/favicon.ico') return res.end('404')
        //html = tmpl;
        //console.log(html);
        pdf.create(html, { height: '13in', width: '8.5in' }).toStream((err, stream) => {
        if (err) return res.end(err.stack)
        res.setHeader('Content-type', 'application/pdf')
        stream.pipe(res)
        })
    });
    
    window.bims.pdfServer.listen(8080, function (err) {
        if (err) throw err
        console.log('Listening on http://localhost:%s', window.bims.pdfServer.address().port)
    })
    window.open('http://localhost:' + window.bims.pdfServer.address().port, 'PDF View');
};

// Export the Util constructor from this module.
module.exports = PDFGenerator;
