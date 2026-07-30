const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Rebrand
  content = content.replace(/CollegePortal/g, 'CampusFlow');
  content = content.replace(/College Portal/g, 'CampusFlow');
  
  // Color theme shift (blue -> indigo)
  content = content.replace(/blue-/g, 'indigo-');
  content = content.replace(/text-blue-/g, 'text-indigo-');
  content = content.replace(/bg-blue-/g, 'bg-indigo-');
  content = content.replace(/border-blue-/g, 'border-indigo-');
  content = content.replace(/ring-blue-/g, 'ring-indigo-');
  content = content.replace(/shadow-blue-/g, 'shadow-indigo-');
  content = content.replace(/from-blue-/g, 'from-indigo-');
  content = content.replace(/to-blue-/g, 'to-indigo-');

  // Add scale animation to primary buttons (crude heuristic but effective)
  content = content.replace(/hover:bg-indigo-700 transition-(all|colors)/g, 'hover:bg-indigo-700 hover:scale-105 transition-all duration-300');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory(directoryPath);

// Also update index.html title
const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  indexContent = indexContent.replace(/<title>.*<\/title>/, '<title>CampusFlow - Academic Management</title>');
  fs.writeFileSync(indexPath, indexContent, 'utf8');
  console.log('Updated index.html');
}

console.log('Global rebranding complete.');
