const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to calculate relative path from source file to target directory
function getRelativePath(fromPath, toPath) {
  const fromDir = path.dirname(fromPath);
  const relativePath = path.relative(fromDir, toPath).replace(/\\/g, '/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

// Function to convert a path to use forward slashes
const toForwardSlashes = (p) => p.replace(/\\/g, '/');

// Function to compute the relative path from the current file to the src directory
const getRelativePathToSrc = (filePath) => {
  const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'src'));
  return relativePath === '' ? '.' : toForwardSlashes(relativePath);
};

// Target directory for UI components
const uiComponentsDir = path.join(__dirname, '..', 'components', 'ui');
// Target directory for src
const srcDir = path.join(__dirname, '..', 'src');

// Files to process (all TSX/JSX files in app directory)
const files = glob.sync('src/**/*.@(tsx|jsx|ts)', { cwd: path.join(__dirname, '..') });

let updatedFiles = 0;
let totalReplacements = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  let replacements = 0;

  // Replace @/components/ui/ with relative path
  const uiImportRegex = /from\s+['"]@\/components\/ui\/([^'"]+)['"]/g;
  content = content.replace(uiImportRegex, (match, component) => {
    const relativePath = getRelativePath(filePath, uiComponentsDir);
    replacements++;
    totalReplacements++;
    return `from '${relativePath}/${component}'`;
  });

  // Replace ~/components/ui/ with relative path
  const tildeImportRegex = /from\s+['"]~\/components\/ui\/([^'"]+)['"]/g;
  content = content.replace(tildeImportRegex, (match, component) => {
    const relativePath = getRelativePath(filePath, uiComponentsDir);
    replacements++;
    totalReplacements++;
    return `from '${relativePath}/${component}'`;
  });

  // Replace @/ with relative path to src directory
  const atImportRegex = /from\s+['"]@\/([^'"]+)['"]/g;
  content = content.replace(atImportRegex, (match, importPath) => {
    const targetPath = path.join(srcDir, importPath);
    const relativePath = getRelativePathToSrc(filePath);
    replacements++;
    totalReplacements++;
    return `from '${relativePath}/${importPath}'`;
  });

  // Write updated content back to file if changes were made
  if (replacements > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedFiles++;
    console.log(`Updated ${file} with ${replacements} replacements`);
  }
});

console.log(`\nSummary:`);
console.log(`Total files processed: ${files.length}`);
console.log(`Files updated: ${updatedFiles}`);
console.log(`Total replacements made: ${totalReplacements}`);
if (totalReplacements === 0) {
  console.log('No import paths needed updating.');
} else {
  console.log('Import paths have been updated to use relative paths.');
}
