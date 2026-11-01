import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const slides = JSON.parse(await readFile('src/slides.json', 'utf8'));
await mkdir('.export-build', { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const output = [];
try {
  for (const source of slides) {
    await page.goto(`http://127.0.0.1:5173/slides/${source.file}.svg`);
    await page.evaluate(() => document.fonts.ready);
    const elements = await page.evaluate(() => {
      const root = document.documentElement;
      const result = [];
      const num = (node, name) => Number(node.getAttribute(name) || 0);
      const point = (matrix, x, y) => ({
        x: matrix.a * x + matrix.c * y + matrix.e,
        y: matrix.b * x + matrix.d * y + matrix.f,
      });
      function opacity(node) {
        let value = 1;
        for (let p = node; p && p !== root.parentElement; p = p.parentElement)
          value *= Number(getComputedStyle(p).opacity);
        return value;
      }
      function frame(node, box) {
        const matrix = node.getCTM(),
          center = point(matrix, box.x + box.width / 2, box.y + box.height / 2);
        return {
          left: center.x - box.width / 2,
          top: center.y - box.height / 2,
          width: box.width,
          height: box.height,
          rotation: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
        };
      }
      for (const node of root.querySelectorAll('rect,circle,ellipse,line,path,text,image')) {
        if (node.closest('defs')) continue;
        const style = getComputedStyle(node),
          type = node.localName,
          matrix = node.getCTM();
        const common = {
          type,
          fill: style.fill,
          stroke: style.stroke,
          strokeWidth: parseFloat(style.strokeWidth),
          opacity: opacity(node),
          fillOpacity: Number(style.fillOpacity),
          strokeOpacity: Number(style.strokeOpacity),
          dash: style.strokeDasharray,
        };
        if (type === 'text') {
          const box = node.getBBox();
          result.push({
            ...common,
            text: node.textContent,
            fontSize: parseFloat(style.fontSize),
            fontWeight: Number(style.fontWeight),
            letterSpacing: parseFloat(style.letterSpacing) || 0,
            frame: frame(node, box),
          });
          continue;
        }
        if (type === 'image') {
          const clipId = (node.getAttribute('clip-path') || '').match(/#([^)]*)/)?.[1];
          const clip = clipId ? document.getElementById(clipId)?.querySelector('rect') : null;
          const original = {
            x: num(node, 'x'),
            y: num(node, 'y'),
            width: num(node, 'width'),
            height: num(node, 'height'),
          };
          const box = clip
            ? {
                x: num(clip, 'x'),
                y: num(clip, 'y'),
                width: num(clip, 'width'),
                height: num(clip, 'height'),
              }
            : original;
          const crop = {
            left: Math.max(0, (box.x - original.x) / original.width),
            top: Math.max(0, (box.y - original.y) / original.height),
            right: Math.max(0, (original.x + original.width - box.x - box.width) / original.width),
            bottom: Math.max(
              0,
              (original.y + original.height - box.y - box.height) / original.height,
            ),
          };
          result.push({
            type,
            dataUrl: node.getAttribute('href'),
            frame: frame(node, box),
            crop,
            radius: clip ? num(clip, 'rx') : 0,
          });
          continue;
        }
        if (type === 'line') {
          result.push({
            ...common,
            points: [
              point(matrix, num(node, 'x1'), num(node, 'y1')),
              point(matrix, num(node, 'x2'), num(node, 'y2')),
            ],
          });
          continue;
        }
        if (type === 'path' || (type === 'circle' && style.strokeDasharray !== 'none')) {
          const full = node.getTotalLength(),
            length = type === 'circle' ? Math.min(full, parseFloat(style.strokeDasharray)) : full;
          const count = Math.max(2, Math.ceil(length / 2));
          const points = [];
          for (let i = 0; i <= count; i++) {
            const p = node.getPointAtLength((length * i) / count);
            points.push(point(matrix, p.x, p.y));
          }
          result.push({
            ...common,
            type: 'path',
            dash: type === 'circle' ? 'none' : common.dash,
            points,
          });
          continue;
        }
        result.push({
          ...common,
          frame: frame(node, node.getBBox()),
          radius: type === 'rect' ? num(node, 'rx') : 0,
        });
      }
      return result;
    });
    output.push({ ...source, elements });
  }
  await writeFile('.export-build/scene.json', JSON.stringify(output));
  console.log(
    `Prepared ${output.length} SVG scenes: ${output.reduce((n, s) => n + s.elements.filter((e) => e.type === 'text').length, 0)} editable text objects.`,
  );
} finally {
  await browser.close();
}
