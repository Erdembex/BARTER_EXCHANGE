/**
 * Statik Colors import'unu createThemedStyles hook'una dönüştürür.
 * Kullanım: node scripts/migrate-themed-styles.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '../src');

const SKIP = new Set([
  'theme/colors.ts',
  'theme/colorsLight.ts',
  'theme/useThemeColors.ts',
  'theme/restyle.ts',
  'theme/createThemedStyles.ts',
  'lib/taskUtils.ts',
  'lib/couponVisuals.ts',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.relative(srcRoot, path.join(dir, entry.name)).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      walk(path.join(dir, entry.name), files);
    } else if (/\.(tsx|ts)$/.test(entry.name) && !SKIP.has(rel)) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('StyleSheet.create') || !content.includes('Colors.')) return false;
  if (content.includes('createThemedStyles') || content.includes('useThemeColors()')) {
    // already partially migrated — skip if createThemedStyles present with styles hook
    if (content.includes('createThemedStyles')) return false;
  }
  if (!/import\s*\{[^}]*\bColors\b[^}]*\}\s*from\s*['"]@\/theme['"]/.test(content) &&
      !/import\s*\{[^}]*\bColors\b[^}]*\}\s*from\s*['"][^'"]*theme['"]/.test(content)) {
    return false;
  }

  const hookName = 'useScreenStyles';

  // Replace StyleSheet.create block
  if (!content.includes('const styles = StyleSheet.create({')) return false;

  content = content.replace(
    /const styles = StyleSheet\.create\(\{/,
    `const ${hookName} = createThemedStyles((Colors) => ({`
  );

  // Fix closing of styles block — last `});` before EOF or next export
  const stylesStart = content.indexOf(`const ${hookName} = createThemedStyles`);
  if (stylesStart === -1) return false;

  const afterStart = content.slice(stylesStart);
  const closeIdx = afterStart.lastIndexOf('\n});');
  if (closeIdx === -1) return false;
  content =
    content.slice(0, stylesStart + closeIdx) +
    '\n}));' +
    content.slice(stylesStart + closeIdx + 4);

  // Update theme import
  content = content.replace(
    /import\s*\{([^}]*)\bColors\b,\s*([^}]*)\}\s*from\s*('[^']*theme[^']*'|"[^"]*theme[^"]*");/,
    (m, before, after, from) => {
      const parts = `${before}${after}`
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!parts.includes('createThemedStyles')) parts.push('createThemedStyles');
      if (!parts.includes('useThemeColors')) parts.push('useThemeColors');
      return `import { ${parts.join(', ')} } from ${from};`;
    }
  );
  content = content.replace(
    /import\s*\{([^}]*)\bColors\b([^}]*)\}\s*from\s*('[^']*theme[^']*'|"[^"]*theme[^"]*");/,
    (m, before, after, from) => {
      const parts = `${before}${after}`
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((p) => p !== 'Colors');
      if (!parts.includes('createThemedStyles')) parts.push('createThemedStyles');
      if (!parts.includes('useThemeColors')) parts.push('useThemeColors');
      return `import { ${parts.join(', ')} } from ${from};`;
    }
  );

  // Inject hook in first function component body
  const fnMatch = content.match(
    /export default function \w+\([^)]*\)\s*\{/
  );
  const namedMatch = content.match(
    /export function \w+\([^)]*\)\s*\{/
  );
  const match = fnMatch || namedMatch;
  if (!match) return false;

  const insertAt = match.index + match[0].length;
  const injection = `\n  const Colors = useThemeColors();\n  const styles = ${hookName}();`;
  if (content.includes(`const styles = ${hookName}()`)) {
    // already injected
  } else {
    content = content.slice(0, insertAt) + injection + content.slice(insertAt);
  }

  // Remove StyleSheet from react-native import if unused
  if (!content.includes('StyleSheet.')) {
    content = content.replace(
      /,\s*StyleSheet/g,
      ''
    );
    content = content.replace(
      /StyleSheet,\s*/g,
      ''
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

const files = walk(srcRoot);
let count = 0;
for (const file of files) {
  if (migrateFile(file)) {
    count++;
    console.log('Migrated:', path.relative(srcRoot, file));
  }
}
console.log(`Done. Migrated ${count} files.`);
