const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Copy all static root files
const files = fs.readdirSync(rootDir);
files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.xlsx'].includes(ext)) {
        fs.copyFileSync(path.join(rootDir, file), path.join(distDir, file));
        console.log(`Copied ${file} to dist/`);
    }
});

// Recursively copy a directory
function copyDirSync(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy assets directory if it exists
const assetsDir = path.join(rootDir, 'assets');
if (fs.existsSync(assetsDir) && fs.lstatSync(assetsDir).isDirectory()) {
    copyDirSync(assetsDir, path.join(distDir, 'assets'));
    console.log(`Copied assets/ to dist/assets/`);
}

// Copy scripts directory (for app.js etc.)
const scriptsDir = path.join(rootDir, 'scripts');
if (fs.existsSync(scriptsDir) && fs.lstatSync(scriptsDir).isDirectory()) {
    copyDirSync(scriptsDir, path.join(distDir, 'scripts'));
    console.log(`Copied scripts/ to dist/scripts/`);
}

console.log("Static build completed successfully!");
