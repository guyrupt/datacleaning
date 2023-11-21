const { convertArrayToCSV } = require('convert-array-to-csv');
const fs = require('fs');

const writeCSV = (products, filename) => {
    const csvString = convertArrayToCSV(products);
    
    fs.writeFile(filename, csvString, 'utf8', function (err) {
        if (err) {
            console.error("Error occured - CSV string not generated");
        } else{
            console.log('CSV string generated!');
        }
    });
}


module.exports = { writeCSV }