// Gera os arquivos da identidade a partir do código:
//   assets/mascot/*.svg e assets/brand/*.svg  (fontes versionadas)
//   <saída>/*.png                             (ícone, ícone adaptativo, splash)
// Uso: node scripts/build-assets.mjs [pasta-de-saída-dos-png]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { logo, symbolArt, symbolSilhouetteMask } from './logo.mjs';
import { C } from './palette.mjs';
import { headArt, poses } from './mascot.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, '..');
const pngOut = resolve(process.argv[2] ?? join(pkg, 'build'));

function write(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function png(svgText, width) {
  return new Resvg(svgText, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

function svg1024(body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;
}

/** Centraliza uma arte no quadro 1024 com a altura indicada. */
function centered(art, height, offsetY = 0) {
  const s = height / art.height;
  const x = 512 - (art.width * s) / 2;
  const y = 512 - (art.height * s) / 2 + offsetY;
  return `<g transform="translate(${x} ${y}) scale(${s})">${art.svg}</g>`;
}

// Poses da toupeira
for (const [name, make] of Object.entries(poses)) {
  write(join(pkg, 'assets/mascot', `${name}.svg`), make());
}
write(join(pkg, 'assets/mascot', 'cabeca.svg'), headArt());

// Logo e símbolo
const marks = logo();
write(join(pkg, 'assets/brand/logo.svg'), marks.dark);
write(join(pkg, 'assets/brand/logo-light.svg'), marks.light);
write(join(pkg, 'assets/brand/logo-mono.svg'), marks.mono);
write(join(pkg, 'assets/brand/symbol.svg'), marks.symbol);

// Ícones do Android. O símbolo fica dentro da zona segura de 66/108 do quadro
// (≈ 626 px de 1024), sem sombra nem máscara embutidas além da sombra do desenho.
// Os óculos passam da largura do O, por isso o símbolo fica em 470 px de altura.
const art = symbolArt();
const foreground = svg1024(centered(art, 470));
const full = svg1024(`<rect width="1024" height="1024" fill="${C.ink}"/>${centered(art, 660)}`);
const sil = symbolSilhouetteMask('cut');
const mono = svg1024(centered(sil, 500), sil.defs);
const splash = svg1024(centered(art, 600));

write(join(pkg, 'assets/brand/icon-foreground.svg'), foreground);
write(join(pkg, 'assets/brand/icon.svg'), full);
write(join(pkg, 'assets/brand/icon-monochrome.svg'), mono);

mkdirSync(pngOut, { recursive: true });
writeFileSync(join(pngOut, 'icon.png'), png(full, 1024));
writeFileSync(join(pngOut, 'adaptive-icon-foreground.png'), png(foreground, 1024));
writeFileSync(join(pngOut, 'adaptive-icon-monochrome.png'), png(mono, 1024));
writeFileSync(join(pngOut, 'splash-icon.png'), png(splash, 1024));

console.log(`SVGs em ${join(pkg, 'assets')}; PNGs em ${pngOut}`);

// Módulo TypeScript com os SVGs, para o app (react-native-svg) e o site usarem
// sem etapa de build. Gerado: não editar à mão.
const svgModule = [
  '// Gerado por scripts/build-assets.mjs. Não edite à mão.',
  `export const logoSvg = ${JSON.stringify(marks.dark.trim())};`,
  `export const logoLightSvg = ${JSON.stringify(marks.light.trim())};`,
  `export const symbolSvg = ${JSON.stringify(marks.symbol.trim())};`,
  'export const mascotSvg = {',
  ...Object.entries(poses).map(([name, make]) => `  ${JSON.stringify(name)}: ${JSON.stringify(make().trim())},`),
  '} as const;',
  'export type MascotPose = keyof typeof mascotSvg;',
  '/** Cabeça da toupeira, para a animação do carregando (três cabeças saindo da toca). */',
  `export const mascotHeadSvg = ${JSON.stringify(headArt().trim())};`,
  '',
].join('\n');
write(join(pkg, 'src/svg.generated.ts'), svgModule);

// Ícone do site (convenção de arquivo do Next.js: app/icon.svg).
write(resolve(pkg, '../../apps/web/src/app/icon.svg'), marks.symbol);
