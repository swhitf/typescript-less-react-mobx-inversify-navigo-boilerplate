const rimraf = require('rimraf');

console.log('Cleaning...');
rimraf('./build', () => {});
rimraf('./dist', () => {});