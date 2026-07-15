const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Copy all static root files
const files = fs.readdirSync(__dirname);
files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.xlsx'].includes(ext)) {
        fs.copyFileSync(path.join(__dirname, file), path.join(distDir, file));
        console.log(`Copied ${file} to dist/`);
    }
});

// Copy clients directory if it exists
const clientsDir = path.join(__dirname, 'clients');
if (fs.existsSync(clientsDir) && fs.lstatSync(clientsDir).isDirectory()) {
    const distClientsDir = path.join(distDir, 'clients');
    if (!fs.existsSync(distClientsDir)) {
        fs.mkdirSync(distClientsDir);
    }
    const clientFiles = fs.readdirSync(clientsDir);
    clientFiles.forEach(file => {
        fs.copyFileSync(path.join(clientsDir, file), path.join(distClientsDir, file));
        console.log(`Copied client logo ${file} to dist/clients/`);
    });
}

console.log("Static build completed successfully!");
