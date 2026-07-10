const fs = require('fs');

function removeMascotClick(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/<div class="mascot-container" onclick="alert\([^)]+\)">/g, '<div class="mascot-container">');
    content = content.replace(/<div class="mascot-container" onclick='alert\([^)]+\)'>/g, '<div class="mascot-container">');
    fs.writeFileSync(file, content);
}

removeMascotClick('index.html');
removeMascotClick('campaign.html');
removeMascotClick('digital-marketing.html');
console.log('Removed inline mascot onclick');
