const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Clear dist before copying. Without this the folder only ever grows: files
// deleted or replaced at source (a .jpg swapped for a .webp, say) linger here
// forever and get shipped in the deploy zip.
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy all static root files
const files = fs.readdirSync(rootDir);
files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    // Web-servable types only. Don't add document formats (.xlsx, .docx, .pdf)
    // here — dist/ is uploaded to the public web root, so anything copied in
    // becomes publicly downloadable.
    if (['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'].includes(ext)) {
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
