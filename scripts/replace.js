const fs = require('fs');
let content = fs.readFileSync('web-development-services.html', 'utf8');

content = content.replace(/style="background-image: linear-gradient\(rgba\(0,0,0,0\.6\), rgba\(0,0,0,0\.8\)\), url\('([^']+)'\); background-size: cover; background-position: center; border: none;"/g, 'style="--bg-image: url(\'$1\');"');

content = content.replace(/style="min-height: 220px; justify-content: flex-end; background-image: linear-gradient\(rgba\(0,0,0,0\.4\), rgba\(0,0,0,0\.8\)\), url\('([^']+)'\); background-size: cover; background-position: center; border: none;"/g, 'style="--bg-image: url(\'$1\');"');

fs.writeFileSync('web-development-services.html', content);
console.log('Replaced inline styles');
