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

const formatMoney = function (amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? "-" : "";

        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
        console.log(e)
    }
}
const toFixed = function (num, fixed) {
    var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
}

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
        html = fs.readFileSync('./lib/js/pdf-generator/BRGYClearance/brgyclearance1.html', 'utf8');
        html = html.replace('{{brgyLogo}}', window.bims.imageLocations + 'buting-logo.jpg');
        html = html.replace('{{pasigLogo}}', window.bims.imageLocations + 'pasig-logo.jpg');
        html = html.replace('{{FullName}}', data.FirstName + " " + data.MiddleName + " " + data.LastName );
        html = html.replace('{{FullAddress}}', data.AddressNo + " " + data.AddressSt );
        html = html.replace('{{Date}}', Moment(data.DateCreated).format('Do') + " Day of " + Moment(data.DateCreated).format('MMMM') + ", " + Moment(data.DateCreated).format('YYYY') );
        html = html.replace('{{Purpose}}', data.Purpose);
        html = html.replace('{{Image}}', data.Image);
        html = html.replace('{{ControlNo}}', data.ControlNo);
    }
    if (type == "Certificate of Indigency") {
        html = fs.readFileSync('./lib/js/pdf-generator/BRGYIndigency/brgyIngency.html', 'utf8');
        html = html.replace('{{brgyLogo}}', window.bims.imageLocations + 'buting-logo.jpg');
        html = html.replace('{{pasigLogo}}', window.bims.imageLocations + 'pasig-logo.jpg');
        html = html.replace('{{FullName}}', data.FirstName + " " + data.MiddleName + " " + data.LastName );
        html = html.replace('{{FullAddress}}', data.AddressNo + " " + data.AddressSt );
        html = html.replace('{{Date}}', Moment(data.DateCreated).format('Do') + " Day of " + Moment(data.DateCreated).format('MMMM') + ", " + Moment(data.DateCreated).format('YYYY') );
        html = html.replace('{{Purpose}}', data.Purpose);
        html = html.replace('{{Image}}', data.Image);
        html = html.replace('{{ControlNo}}', data.ControlNo);
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

PDFGenerator.prototype.generateBusinessClearance = function (data) {
    
    // var options = { format: 'Letter' };
    var options = { height: '13in', width: '8.5in' };
    var html;
    var html = fs.readFileSync('./lib/js/pdf-generator/BusinessPermit/businessclearance.html', 'utf8');
    html = html.replace('{{brgyLogo}}', window.bims.imageLocations + 'buting-logo.jpg');
    html = html.replace('{{pasigLogo}}', window.bims.imageLocations + 'pasig-logo.jpg');
    html = html.replace('{{OwnerImage}}', window.bims.imageLocations + "/OwnerImages/" + data.OwnerImage);
    html = html.replace('{{BusinessName}}', data.BusinessName);
    html = html.replace('{{BusinessAddress}}', data.BusinessAddress);
    html = html.replace('{{FloorArea}}', data.FloorArea);
    html = html.replace('{{Capitalization}}', "₱ " + formatMoney(toFixed(data.Capitalization,2)));
    html = html.replace('{{DTI_SEC_RegNo}}', data.DTI_SEC_RegNo);
    html = html.replace('{{KindOfBusiness}}', data.KindOfBusiness);
    html = html.replace('{{OwnerFullName}}', data.OwnerFullName);
    html = html.replace('{{OwnerAddress}}', data.OwnerAddress);
    html = html.replace('{{OwnerContactNo}}', data.OwnerContactNo);
    html = html.replace('{{BusinessContactNo}}', data.BusinessContactNo);
    html = html.replace('{{ControlNo}}', data.ControlNo);

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

PDFGenerator.prototype.generateReport = function (data) {
    
    // var options = { format: 'Letter' };
    var options = { height: '13in', width: '8.5in' };
    var html;
    var html = fs.readFileSync('./lib/js/pdf-generator/preMadeReport.html', 'utf8');
    html = html.replace('{{Report}}',data);

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
