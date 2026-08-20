import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/features/trade');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx') && f !== 'tradeTheme.ts');

for (const file of files) {
  const fp = path.join(dir, file);
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes('tradeTheme')) continue;

  if (!c.includes("from '@/theme'") && !c.includes('useThemeColors')) {
    c = c.replace(
      /(import \{ useTranslation \} from '@\/i18n';)/,
      "$1\nimport { Spacing, useThemeColors } from '@/theme';"
    );
    if (!c.includes('useThemeColors')) {
      c = c.replace(
        /(import \{ Text \} from '@\/components\/ui\/Text';)/,
        "$1\nimport { Spacing, useThemeColors } from '@/theme';"
      );
    }
  }

  c = c.replace(
    /import \{ useTradeTheme, tradeTheme \} from '\.\/tradeTheme';/g,
    "import { useTradeTheme, TradeTheme } from './tradeTheme';"
  );
  c = c.replace(/createBox<tradeTheme>\(\)/g, 'createBox<TradeTheme>()');

  c = c.replace(/tradeTheme\.colors\.tradePrimary/g, 'Colors.primary');
  c = c.replace(/tradeTheme\.colors\.tradeAccent/g, 'Colors.accent');
  c = c.replace(/tradeTheme\.colors\.textMuted/g, 'Colors.textMuted');
  c = c.replace(/tradeTheme\.colors\.text/g, 'Colors.text');
  c = c.replace(/tradeTheme\.colors\.background/g, 'Colors.background');
  c = c.replace(/tradeTheme\.colors\.surface/g, 'Colors.surface');
  c = c.replace(/tradeTheme\.colors\.border/g, 'Colors.border');
  c = c.replace(/tradeTheme\.colors\.white/g, 'Colors.white');
  c = c.replace(/tradeTheme\.colors\.success/g, 'Colors.success');
  c = c.replace(/tradeTheme\.colors\.error/g, 'Colors.error');
  c = c.replace(/tradeTheme\.spacing\.md/g, 'Spacing[4]');
  c = c.replace(/tradeTheme\.spacing\.lg/g, 'Spacing[5]');
  c = c.replace(/tradeTheme\.spacing\['2xl'\]/g, 'Spacing[8]');

  // Inject Colors hook in exported function if missing
  if (c.includes('Colors.') && !c.includes('const Colors = useThemeColors()')) {
    c = c.replace(
      /export function (\w+)\([^)]*\)\s*\{/,
      'export function $1() {\n  const Colors = useThemeColors();'
    );
  }

  // TradeMarketScreen already has useTradeTheme
  if (file !== 'TradeMarketScreen.tsx' && c.includes('<ThemeProvider theme={tradeTheme}>')) {
    c = c.replace(
      /export function (\w+)\([^)]*\)\s*\{\n  const Colors = useThemeColors\(\);/,
      'export function $1() {\n  const tradeTheme = useTradeTheme();\n  const Colors = useThemeColors();'
    );
  }

  fs.writeFileSync(fp, c, 'utf8');
  console.log('Fixed', file);
}
