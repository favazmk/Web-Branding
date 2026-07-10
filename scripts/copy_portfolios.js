const fs = require('fs');

fs.copyFileSync('public/portfolio-1.jpg', 'public/portfolio-5.jpg');
fs.copyFileSync('public/portfolio-2.jpg', 'public/portfolio-6.jpg');
fs.copyFileSync('public/portfolio-4.jpg', 'public/portfolio-7.jpg');
fs.copyFileSync('public/portfolio-1.jpg', 'public/portfolio-8.jpg');
fs.copyFileSync('public/portfolio-2.jpg', 'public/portfolio-9.jpg');

console.log('Copied placeholders');
