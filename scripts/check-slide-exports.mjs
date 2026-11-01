import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export async function inspectExports() {
  const slides = JSON.parse(await readFile('src/slides.json', 'utf8'));
  const inputs = { 'slides.json': hash(JSON.stringify(slides)) };
  for (const slide of slides)
    inputs[slide.file + '.svg'] = hash(await readFile('public/slides/' + slide.file + '.svg'));
  const html = await readFile('public/lumen-design-story.html');
  const pptx = await readFile('public/lumen-design-story.pptx');
  const zip = unzipSync(pptx);
  const names = Object.keys(zip)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
  if (names.length !== slides.length)
    throw new Error('PPTXのスライド枚数が元データと一致しません。');
  const nativeTextCounts = names.map((name) => (strFromU8(zip[name]).match(/<a:t>/g) || []).length);
  if (nativeTextCounts.some((count) => count < 5))
    throw new Error('PPTXに編集可能な文字が不足しています。');
  const nativeShapeCounts = names.map(
    (name) => (strFromU8(zip[name]).match(/<p:sp>/g) || []).length,
  );
  if (nativeShapeCounts.some((count) => count < 5))
    throw new Error('PPTXに編集可能な図形が不足しています。');
  const meta = html
    .toString()
    .match(/<script id="slide-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!meta) throw new Error('HTMLのスライドデータがありません。');
  const embedded = JSON.parse(meta[1]);
  if (
    embedded.length !== slides.length ||
    embedded.some(
      (slide, i) =>
        slide.file !== slides[i].file || !slide.image.startsWith('data:image/svg+xml;base64,'),
    )
  )
    throw new Error('HTMLのスライドが元データと一致しません。');
  return {
    slideCount: slides.length,
    sourceHashes: inputs,
    files: {
      html: { name: 'lumen-design-story.html', sha256: hash(html), bytes: html.length },
      pptx: { name: 'lumen-design-story.pptx', sha256: hash(pptx), bytes: pptx.length },
    },
    nativeTextCounts,
    nativeShapeCounts,
  };
}
export async function verifyExports() {
  const actual = await inspectExports(),
    recorded = JSON.parse(await readFile('public/slide-exports.json', 'utf8'));
  if (JSON.stringify(actual) !== JSON.stringify(recorded))
    throw new Error(
      '書き出しファイルが元スライドと一致しません。npm run exports で再生成してください。',
    );
  return actual;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv.includes('--record')) {
    await writeFile(
      'public/slide-exports.json',
      JSON.stringify(await inspectExports(), null, 2) + '\n',
    );
    console.log('Recorded HTML/PPTX export manifest.');
  } else {
    const result = await verifyExports();
    console.log(
      `Verified ${result.slideCount} HTML/PPTX slides, ${result.nativeTextCounts.reduce((a, b) => a + b, 0)} native text objects.`,
    );
  }
}
