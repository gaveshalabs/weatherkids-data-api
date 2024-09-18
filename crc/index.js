const crypto = require('crypto');
const crc = require('crc');
const fs = require('fs');

// function generateRandomCRC32() {
//     const randomString = crypto.randomBytes(8).toString('hex');
//     const crc32Value = crc.crc32(randomString).toString(16).toUpperCase();
//     return crc32Value.padStart(8, '0'); 
// }
// const crc32 = generateRandomCRC32();
// console.log('Generated CRC32:', crc32);

function generateCRC32(input) {
    return new Promise((resolve, reject) => {
        if (typeof input === 'string') {
            if (fs.existsSync(input)) {
                fs.readFile(input, (err, data) => {
                    if (err) {
                        return reject(new Error('Error reading file: ' + err.message));
                    }
                    const crc32Value = crc.crc32(data).toString(16).toUpperCase();
                    resolve(crc32Value.padStart(8, '0'));
                });
            } else {
                return reject(new Error('File path does not exist: ' + input));
            }
        } else {
            return reject(new Error('Unsupported input type'));
        }
    });
}
const filePath = process.argv[2]; 

if (!filePath) {
    console.error('Please provide a file path as a command-line argument.');
    process.exit(1);
}
generateCRC32(filePath)
    .then(crc32 => console.log('File CRC32:', crc32))
    .catch(err => console.error('Error:', err.message));
