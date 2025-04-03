const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');

if (dirIndex !== -1 && args[dirIndex + 1]) {
    const dirPath = args[dirIndex + 1];

    fs.readdir(dirPath, (err, files) => {
        if (err) {
            console.error(`Error reading directory: ${err.message}`);
            return;
        }

        const filteredFiles = files.filter(file => file !== 'info.json');
        console.log(filteredFiles);
    });
} else {
    console.error('Usage: node name.js --dir <directory_path>');
}
