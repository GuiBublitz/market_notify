const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, 'scraper', 'projects');
const projectFiles = fs.readdirSync(projectsDir).filter(file => file.endsWith('.js'));

const projectModules = projectFiles.reduce((acc, file) => {
  const projectName = path.basename(file, '.js');
  acc[projectName] = projectName;
  return acc;
}, {});

console.log('ACTIVE PROJECTS: ', projectModules);

module.exports = projectModules;