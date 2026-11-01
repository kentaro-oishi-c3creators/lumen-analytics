// Converts the existing SVG slides to native PowerPoint text and vector objects.
// Requires the Codex bundled @oai/artifact-tool runtime; the generated PPTX is tracked.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const workspaceDir = process.cwd();
const runtimeModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const runtimePython = process.env.CODEX_PRIMARY_RUNTIME_PYTHON;
const skillDir = process.env.PRESENTATIONS_SKILL_DIR || '/opt/codex/skills/builtins/presentations';
if (!path.isAbsolute(runtimeModules || '') || !path.isAbsolute(runtimePython || ''))
  throw new Error('The bundled Codex presentation runtime is required.');
process.env.RUNTIME_NODE_MODULES = runtimeModules;
process.env.RUNTIME_NODE = process.env.CODEX_PRIMARY_RUNTIME_NODE;
process.env.RUNTIME_PYTHON = runtimePython;
process.env.RUNTIME_BIN_DIR = path.join(
  process.env.CODEX_PRIMARY_RUNTIME,
  'dependencies/bin/override',
);
const require = createRequire(path.join(runtimeModules, 'package.json'));
const { Presentation, PresentationFile } = await import(
  pathToFileURL(require.resolve('@oai/artifact-tool')).href
);
const { finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')).href
);
const scenes = JSON.parse(await fs.readFile('.export-build/scene.json', 'utf8'));
const pres = Presentation.create({ slideSize: { width: 1600, height: 900 } });
const spacings = {};
function color(css, opacity = 1) {
  if (!css || css === 'none' || css === 'transparent') return 'none';
  const match = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  const hex = match
    ? '#' +
      match
        .slice(1, 4)
        .map((n) => Number(n).toString(16).padStart(2, '0'))
        .join('')
    : css;
  return opacity >= 0.999 ? hex : `${hex}/${Math.round(opacity * 100)}`;
}
function line(e) {
  return {
    style: e.dash && e.dash !== 'none' ? 'dashed' : 'solid',
    fill: color(e.stroke, e.opacity * e.strokeOpacity),
    width: e.stroke === 'none' ? 0 : e.strokeWidth,
  };
}
function custom(slide, e, name) {
  const xs = e.points.map((p) => p.x),
    ys = e.points.map((p) => p.y);
  const left = Math.min(...xs),
    top = Math.min(...ys),
    width = Math.max(1, Math.max(...xs) - left),
    height = Math.max(1, Math.max(...ys) - top);
  slide.shapes.add({
    name,
    geometry: 'custom',
    position: { left, top, width, height },
    fill: color(e.fill, e.opacity * e.fillOpacity),
    line: line(e),
    customPaths: [
      {
        width,
        height,
        commands: e.points.map((p, i) => ({
          [i === 0 ? 'moveTo' : 'lineTo']: { x: p.x - left, y: p.y - top },
        })),
      },
    ],
  });
}
for (let s = 0; s < scenes.length; s++) {
  const source = scenes[s],
    slide = pres.slides.add();
  slide.background.fill = '#f5f5ee';
  for (let i = 0; i < source.elements.length; i++) {
    const e = source.elements[i],
      name = `svg-${s + 1}-${i}-${e.type}`;
    if (e.type === 'text') {
      const box = slide.shapes.add({
        name,
        geometry: 'textbox',
        position: {
          ...e.frame,
          top: e.frame.top + e.fontSize * 0.16,
          width: e.frame.width + 9,
          height: e.frame.height + 4,
        },
        fill: 'none',
        line: { fill: 'none', width: 0 },
      });
      box.text = e.text;
      box.text.style = {
        typeface: 'Noto Sans CJK JP',
        fontSize: e.fontSize,
        bold: e.fontWeight >= 600,
        color: color(e.fill, e.opacity * e.fillOpacity),
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
        alignment: 'left',
        verticalAlignment: 'top',
        autoFit: 'none',
        wrap: 'none',
      };
      if (e.letterSpacing) spacings[name] = Math.round(e.letterSpacing * 75);
    } else if (e.type === 'image') {
      const image = slide.images.add({
        name,
        alt: `${source.title} — 実際のダッシュボード画面`,
        dataUrl: e.dataUrl,
        fit: 'cover',
        position: e.frame,
        crop: e.crop,
        geometry: e.radius ? 'roundRect' : 'rect',
        borderRadius: e.radius || 0,
      });
      image.rotation = e.frame.rotation;
    } else if (e.type === 'line' || e.type === 'path') custom(slide, e, name);
    else
      slide.shapes.add({
        name,
        geometry: e.type === 'rect' ? 'rect' : 'ellipse',
        position: e.frame,
        fill: color(e.fill, e.opacity * e.fillOpacity),
        line: line(e),
        ...(e.radius ? { borderRadius: e.radius } : {}),
      });
  }
  slide.speakerNotes.textFrame.setText(
    source.note +
      '\n\n体験URL: https://kentaro-oishi-c3creators.github.io/lumen-analytics/' +
      source.href +
      '\n元のSVGとスクリーンショットはLUMENプロジェクトで作成。文字と図解は編集可能、ダッシュボード画面は画像です。',
  );
}
const candidatePath = path.join(workspaceDir, `.export-build/candidate-${Date.now()}.pptx`);
await (await PresentationFile.exportPptx(pres)).save(candidatePath);
await fs.writeFile('.export-build/text-spacings.json', JSON.stringify(spacings));
// Preserve the source SVG's letter spacing, which the native text facade does not expose.
execFileSync(
  runtimePython,
  [
    path.join(workspaceDir, 'scripts/pptx-spacing.py'),
    candidatePath,
    path.join(workspaceDir, '.export-build/text-spacings.json'),
    path.join(workspaceDir, '.export-build/scene.json'),
  ],
  { cwd: workspaceDir, stdio: 'pipe' },
);
const finalPath = path.join(
  workspaceDir,
  '.export-output',
  `lumen-design-story-${Date.now()}.pptx`,
);
await fs.mkdir(path.dirname(finalPath), { recursive: true });
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  explicitTotalSlideCount: 10,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(
    skillDir,
    'container_tools/inspect_presentation_package_integrity.py',
  ),
  layoutValidatorPath: path.join(
    skillDir,
    'container_tools/inspect_presentation_layout_geometry.py',
  ),
  layoutArgs: ['--expected-slide-size-emu', '15240000,8572500', '--validate-heading-fit'],
  fontPolicy: { basis: 'design', families: ['Noto Sans CJK JP'] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(
    workspaceDir,
    '.export-build',
    path.basename(finalPath) + '.validation.json',
  ),
});
await fs.copyFile(finalPath, path.join(workspaceDir, 'public/lumen-design-story.pptx'));
console.log(
  JSON.stringify(
    {
      finalPath,
      slides: 10,
      nativeText: scenes.reduce(
        (n, s) => n + s.elements.filter((e) => e.type === 'text').length,
        0,
      ),
      validated: Boolean(result),
    },
    null,
    2,
  ),
);
