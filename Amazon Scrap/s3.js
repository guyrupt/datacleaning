const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3'); 
const { createReadStream } = require('fs');

const s3Client = new S3Client({})

const uploadCSV = async (filename) => {
    const command = new PutObjectCommand({
        Bucket: "comp576-amazon-raw-files",
        Key: filename,
        Body: createReadStream(`${filename}`)
    });

    try {
        await s3Client.send(command);
        console.log(`${filename} uploaded`);
    } catch (err) {
        console.error(`upload ${filename} error`, err);
    }
}


module.exports = { uploadCSV }