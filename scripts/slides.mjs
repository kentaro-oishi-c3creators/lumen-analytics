import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { data, metrics, groups, format } from '../src/data.ts';
// Screenshots are real browser captures. All diagrams, typography and layout are SVG vectors.
const out = 'public/slides';
await mkdir(out, { recursive: true });
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const ink = '#263d34',
  muted = '#84907f',
  green = '#799877',
  cream = '#f5f5ee',
  border = '#dfe4d8';
const txt = (x, y, s, size = 18, color = ink, weight = 400, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" ${extra}>${esc(s)}</text>`;
const line = (x1, y1, x2, y2, color = border, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${extra}/>`;
const rect = (x, y, w, h, fill, rx = 12, stroke = 'none') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
const circle = (x, y, r, fill, stroke = 'none') =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}"/>`;
const small = (x, y, s, color = muted) => txt(x, y, s, 11, color, 500, 'letter-spacing="2"');
const arrow = (x, y, len = 70, color = green) =>
  line(x, y, x + len, y, color, 'stroke-width="1.5"') +
  `<path d="M${x + len - 7} ${y - 5}l7 5-7 5" fill="none" stroke="${color}" stroke-width="1.5"/>`;
const tag = (x, y, text, color = green, bg = '#e9efdf') =>
  rect(x, y - 20, text.length * 12 + 24, 30, bg, 5) + txt(x + 12, y, text, 11, color, 500);
const paragraphs = (x, y, lines, size = 19, color = muted, gap = 34) =>
  lines.map((s, i) => txt(x, y + i * gap, s, size, color)).join('');
const cta = (label = 'ダッシュボードを体験する', dark = false) =>
  rect(1288, 760, 222, 44, dark ? '#c2d7b6' : '#2c4838', 6) +
  txt(1306, 788, label, 12, dark ? '#253a2a' : '#f4f5e8', 450) +
  arrow(1480, 783, 12, dark ? '#253a2a' : '#f4f5e8');
let seq = 0;
const images = {};
async function shot(name, x, y, w, h, { crop = false, offset = 0 } = {}) {
  const png = (images[name] ||= (await readFile(`public/captures/${name}.png`)).toString('base64'));
  const clip = `clip-${seq++}`;
  return (
    `<defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/></clipPath></defs>` +
    rect(x, y, w, h, '#fff', 9, '#dce2d7') +
    `<image href="data:image/png;base64,${png}" x="${x}" y="${y - offset}" width="${w}" height="${crop ? (w * 1100) / 1440 : h}" preserveAspectRatio="${crop ? 'xMinYMin meet' : 'xMidYMid meet'}" clip-path="url(#${clip})"/>`
  );
}
const slides = [];
// 01: visual manifesto
{
  const dark = '#172e27',
    light = '#edf0df';
  let b = rect(0, 0, 1600, 900, dark, 0);
  b +=
    small(84, 135, 'THE ANALYTICS COLLECTION / VOL. 01', '#9aaf95') +
    txt(84, 260, 'データを、', 65, light, 450) +
    txt(84, 360, '意思のある景色へ。', 65, light, 450);
  b += paragraphs(
    88,
    437,
    ['ビジネスの複雑さを、美しい視界に変える。', '4つの業界と、AIがひらくもうひとつの未来。'],
    19,
    '#9fae97',
    36,
  );
  b +=
    line(88, 535, 645, 535, '#486047') +
    txt(88, 599, '04', 47, light, 450) +
    txt(161, 599, '+ AI', 22, '#9bab90') +
    small(88, 632, 'FIVE PERSPECTIVES') +
    txt(316, 599, 'LIVE', 47, light, 450) +
    small(316, 632, 'INTERACTIVE PROTOTYPES');
  b += `<g opacity=".5">${[0, 1, 2].map((i) => `<ellipse cx="1135" cy="406" rx="${360 - i * 38}" ry="${180 + i * 17}" fill="none" stroke="#577350" transform="rotate(${i * 31 - 26} 1135 406)"/>`).join('')}</g>`;
  b += `<g transform="rotate(-7 1120 350)">${await shot('retail', 817, 160, 610, 465)}</g>`;
  b += `<g transform="rotate(6 1240 560)">${await shot('ai', 1050, 480, 460, 300, { crop: true })}</g>`;
  b +=
    tag(824, 738, 'DESIGNED FOR CLARITY', '#a9bf99', '#2a4436') +
    txt(88, 787, '見る。探る。考える。次の意思決定へ。', 14, '#b6c4a7');
  slides.push({ file: '01-opening', body: b, dark: true });
}
// 02: breadth of business
{
  let b =
    small(84, 132, 'FOUR INDUSTRIES. FOUR QUESTIONS.') +
    txt(84, 207, '答えの形は、ビジネスの数だけ。', 43, ink, 450) +
    txt(86, 250, '業務の問いから設計した、4つの分析体験。', 18, muted);
  const cards = [
    [
      'retail',
      '01',
      'Retail',
      '小売・EC',
      '何が、どこで売れている？',
      '売上 / 商品 / 地域',
      '#bf6f56',
    ],
    [
      'manufacturing',
      '02',
      'Manufacturing',
      '製造・品質',
      'どこに生産ロスがある？',
      'OEE / 品質 / 生産計画',
      '#d2a16d',
    ],
    [
      'healthcare',
      '03',
      'Healthcare',
      '医療・病院経営',
      '患者の流れはスムーズ？',
      '来院 / 待ち時間 / 負荷',
      '#4b9b83',
    ],
    [
      'finance',
      '04',
      'Finance',
      '金融・資産運用',
      '成長と安定をどう両立？',
      '配分 / リスク / リターン',
      '#9784b6',
    ],
  ];
  for (let i = 0; i < cards.length; i++) {
    const [id, n, name, jp, q, k, color] = cards[i],
      x = 84 + i * 362;
    b +=
      rect(x, 302, 344, 446, '#fff', 10, border) +
      small(x + 20, 337, n, color) +
      txt(x + 20, 376, name, 24, ink, 500) +
      txt(x + 20, 407, jp, 12, muted);
    b += await shot(id, x + 14, 435, 316, 174, { crop: true });
    b +=
      txt(x + 20, 650, q, 15, ink, 500) +
      line(x + 20, 676, x + 324, 676) +
      txt(x + 20, 709, k, 11, muted);
  }
  b += tag(84, 798, '+ 05  AI COPILOT  /  問いから、アクションへ');
  slides.push({ file: '02-overview', body: b });
}
// 03: retail
{
  let b =
    small(84, 134, '01 / RETAIL & COMMERCE', '#bd7358') +
    txt(84, 218, '成長の理由を、', 43, ink, 450) +
    txt(84, 283, '探る。', 43, ink, 450) +
    paragraphs(86, 345, ['売上だけでは見えない、', '商品と地域のつながりを。'], 18, muted, 33);
  const points = [
    ['01', '全体を俯瞰', '売上・粗利・数量・予算を比較'],
    ['02', '地域で絞る', '選択したエリアに、図表が連動'],
    ['03', '商品を深掘り', '構成比から明細へ、そのまま移動'],
  ];
  points.forEach(([n, t, d], i) => {
    const y = 465 + i * 88;
    b +=
      circle(103, y - 5, 17, '#f0e0d7') +
      txt(94, y, n, 10, '#b57860', 500) +
      txt(135, y, t, 18, ink, 500) +
      txt(135, y + 28, d, 12, muted);
  });
  b += await shot('retail', 480, 145, 1036, 603, { crop: true });
  b += small(500, 779, 'REAL BROWSER CAPTURE · 1440 × 1100') + cta();
  slides.push({ file: '03-retail', body: b });
}
// 04: manufacturing
{
  let b = rect(0, 0, 1600, 900, '#142129', 0);
  b +=
    small(84, 134, '02 / MANUFACTURING & QUALITY', '#d4ab7e') +
    txt(84, 218, '現場の変化を、', 43, '#e8ebe4', 450) +
    txt(84, 283, '見逃さない。', 43, '#e8ebe4', 450) +
    paragraphs(86, 345, ['生産の結果から、', '止まる理由へ。'], 18, '#8e9e9f', 33);
  const m = metrics('manufacturing', data.manufacturing);
  b +=
    circle(225, 518, 104, 'none', '#35444a') +
    `<circle cx="225" cy="518" r="104" fill="none" stroke="#e9af76" stroke-width="7" stroke-dasharray="${(653.45 * m.oee) / 100} 654" transform="rotate(-90 225 518)"/>` +
    small(192, 484, 'OEE', '#8f9b9b') +
    txt(158, 541, format(m.oee, 1), 53, '#e8ebe4', 450) +
    txt(284, 538, '%', 21, '#8f9b9b');
  b +=
    small(85, 683, 'AVAILABILITY × PERFORMANCE × QUALITY', '#acb7ac') +
    paragraphs(
      85,
      720,
      ['時間・性能・良品率の3要素に分解。', 'ラインごとの改善余地を探す。'],
      14,
      '#8f9b9b',
      27,
    );
  b +=
    (await shot('manufacturing', 480, 145, 1036, 603, { crop: true })) +
    small(500, 779, 'REAL BROWSER CAPTURE · 1440 × 1100', '#7d9295') +
    cta('生産・品質を探索する', true);
  slides.push({ file: '04-manufacturing', body: b, dark: true });
}
// 05 healthcare
{
  let b =
    rect(0, 0, 1600, 900, '#f0f5ed', 0) +
    small(84, 134, '03 / HEALTHCARE & OPERATIONS', '#4b9580') +
    txt(84, 218, 'ケアの時間を、', 43, ink, 450) +
    txt(84, 283, 'つくる。', 43, ink, 450) +
    paragraphs(
      86,
      345,
      ['数字の向こうに、患者がいる。', '流れと負荷を、ひとつの視界に。'],
      18,
      muted,
      33,
    );
  const nodes = [
    ['受付', '#c7dfd0'],
    ['診察', '#8dbda5'],
    ['完了', '#4c957c'],
  ];
  nodes.forEach(([t, color], i) => {
    b +=
      rect(86 + i * 122, 470, 96, 72, color, 9) +
      txt(113 + i * 122, 512, t, 18, i === 2 ? '#fff' : ink, 500);
    if (i < 2) b += arrow(187 + i * 122, 506, 16, '#83a28d');
  });
  b +=
    paragraphs(
      86,
      600,
      ['01   来院・待ち時間を把握', '02   診療科の負荷を比較', '03   混雑の場所と時期を探る'],
      17,
      ink,
      53,
    ) + txt(86, 776, '患者フローの経路配分は説明用モデル。', 10, muted);
  b +=
    (await shot('healthcare', 480, 145, 1036, 603, { crop: true })) +
    small(500, 779, 'REAL BROWSER CAPTURE · 1440 × 1100') +
    cta('医療オペレーションを見る');
  slides.push({ file: '05-healthcare', body: b });
}
// 06 finance
{
  let b =
    rect(0, 0, 1600, 900, '#1c1e29', 0) +
    small(84, 134, '04 / FINANCE & INVESTMENT', '#ac9cc7') +
    txt(84, 218, 'リスクを捉え、', 43, '#eeebf2', 450) +
    txt(84, 283, '次の機会へ。', 43, '#eeebf2', 450) +
    paragraphs(
      86,
      345,
      ['資産配分とリスク・リターン。', '分けて見る、つなげて考える。'],
      18,
      '#9694a4',
      33,
    );
  b +=
    line(100, 650, 400, 650, '#444453') +
    line(100, 650, 100, 450, '#444453') +
    line(100, 550, 410, 550, '#444453', 'stroke-dasharray="3 8"') +
    line(250, 650, 250, 440, '#444453', 'stroke-dasharray="3 8"');
  [
    [140, 620, 14, '#b6c2b1'],
    [195, 585, 25, '#9fbbba'],
    [285, 540, 31, '#c2b58f'],
    [340, 475, 42, '#a28cc9'],
  ].forEach(([x, y, r, c]) => (b += circle(x, y, r, c)));
  b +=
    txt(107, 687, '安定', 11, '#9294a1') +
    txt(357, 687, '成長', 11, '#9294a1') +
    small(87, 746, 'ALLOCATION → EXPOSURE → PERSPECTIVE', '#9e94b2') +
    txt(86, 778, 'リスクは保有資産の加重平均による参考指標。', 10, '#8c899c');
  b +=
    (await shot('finance', 480, 145, 1036, 603, { crop: true })) +
    small(500, 779, 'REAL BROWSER CAPTURE · 1440 × 1100', '#8d879f') +
    cta('ポートフォリオを探索する', true);
  slides.push({ file: '06-finance', body: b, dark: true });
}
// 07 real interactions
{
  let b =
    small(84, 132, 'FROM OVERVIEW TO UNDERSTANDING') +
    txt(84, 207, '触れるほど、見えてくる。', 43, ink, 450) +
    txt(86, 250, 'Tableauの分析体験に着想を得た、連動する操作設計。', 18, muted);
  const steps = [
    ['retail', '01', '全体を見る', 'KPI・トレンド・地域を俯瞰'],
    ['retail-filtered', '02', '条件で絞る', '第3四半期 × 関東 × アパレル'],
    ['retail-detail', '03', '明細を確かめる', '月別の実績・前年・計画へ'],
  ];
  for (let i = 0; i < 3; i++) {
    const [name, n, t, d] = steps[i],
      x = 84 + i * 490;
    b +=
      rect(x, 312, 457, 425, '#fff', 10, border) +
      (await shot(name, x + 10, 322, 437, 302, { crop: true })) +
      tag(x + 19, 661, n) +
      txt(x + 73, 663, t, 21, ink, 500) +
      txt(x + 20, 706, d, 13, muted);
    if (i < 2) b += arrow(x + 464, 520, 19);
  }
  b +=
    txt(86, 793, '実際のブラウザで条件変更・詳細表示を操作し、画面を撮影しています。', 13, muted) +
    small(86, 823, 'CROSS FILTER / TOOLTIP / DRILL-DOWN / SAVED VIEW / CSV');
  slides.push({ file: '07-interaction', body: b });
}
// 08 AI future
{
  let b =
    rect(0, 0, 1600, 900, '#17202e', 0) +
    small(84, 132, '05 / A NEW CHAPTER IN ANALYTICS', '#a99cc7') +
    txt(84, 206, 'AIと、仮説のその先へ。', 43, '#eeedf4', 450) +
    txt(86, 250, '問いから、仮説へ。データとともに考える、新しい意思決定。', 18, '#939eb1');
  b += await shot('ai-conversation', 84, 310, 960, 445, { crop: true });
  b += small(1100, 345, 'THE THINKING LOOP', '#a99cc7');
  const labels = [
    ['01', '問いかける', '売上の状況を要約して'],
    ['02', '前提を試す', '需要・単価・販促費を調整'],
    ['03', '根拠とともに考える', '実績とシナリオを分けて回答'],
  ];
  labels.forEach(([n, t, d], i) => {
    const y = 409 + i * 110;
    b +=
      circle(1120, y - 6, 18, '#3a354e') +
      txt(1111, y, n, 10, '#b7a4d4', 500) +
      txt(1156, y, t, 20, '#e9e9f2', 450) +
      txt(1156, y + 30, d, 12, '#8e9cb3');
    if (i < 2) b += line(1120, y + 19, 1120, y + 76, '#464053');
  });
  b +=
    tag(84, 800, 'DEMO FIRST · CLAUDE API READY', '#b1a4d2', '#2c3045') +
    txt(500, 797, '初期状態はルールベースデモ。実APIへの接続は後から設定。', 12, '#8695ad');
  slides.push({ file: '08-ai', body: b, dark: true });
}
// 09 architecture diagram
{
  let b =
    small(84, 132, 'DESIGNED TO BE OPEN. BUILT TO BE SAFE.') +
    txt(84, 207, '美しい体験を、開かれた構成で。', 43, ink, 450) +
    txt(86, 250, 'GitHub Pagesで配信。Claudeの接続は、サーバーに閉じ込める。', 18, muted);
  b +=
    rect(84, 324, 500, 355, '#fff', 13, border) +
    tag(108, 364, 'PUBLIC FRONTEND') +
    txt(111, 420, 'React + TypeScript', 29, ink, 500) +
    txt(111, 460, 'GitHub Pages', 22, green) +
    paragraphs(
      111,
      504,
      [
        'ダッシュボード / SVGプレゼンテーション',
        'ブラウザ内の合成データ集計',
        '静的ファイルだけで、すぐに体験',
      ],
      15,
      muted,
      35,
    ) +
    rect(109, 618, 447, 36, '#edf1e7', 6) +
    txt(128, 642, 'APIキーをフロントエンドに含めない', 13, '#6b8264', 500);
  b +=
    arrow(609, 490, 93) +
    small(606, 460, 'HTTPS / JSON') +
    txt(608, 523, '選択中のデータ', 11, muted);
  b +=
    rect(730, 324, 430, 355, '#eaf0e4', 13, '#d5dfcb') +
    tag(755, 364, 'PRIVATE API SERVER', '#668260', '#dce6d3') +
    txt(756, 420, 'Node.js API', 29, ink, 500) +
    txt(756, 460, 'Anthropic provider', 19, green) +
    paragraphs(
      756,
      504,
      [
        'Origin制限 / トークン認証',
        '入力制限 / 回数制限 / タイムアウト',
        'キー・モデル名は環境変数',
      ],
      15,
      '#7b8f70',
      35,
    ) +
    rect(755, 618, 380, 36, '#dce6d3', 6) +
    txt(774, 642, 'ANTHROPIC_API_KEY / CLAUDE_MODEL', 11, '#668260', 500);
  b += arrow(1184, 490, 78) + small(1180, 460, 'SERVER SIDE');
  b +=
    rect(1290, 390, 226, 200, '#263f32', 13) +
    circle(1403, 437, 14, 'none', '#c5d6b7') +
    txt(1335, 500, 'Claude API', 26, '#e3ebd8', 450) +
    txt(1325, 541, '日本語の分析・提案', 13, '#a4bb95');
  b +=
    line(85, 737, 1515, 737) +
    small(86, 780, 'NO KEY REQUIRED TO EXPLORE') +
    txt(86, 820, 'キー未設定なら、ローカルのルールベースデモで体験できます。', 18, muted);
  slides.push({ file: '09-architecture', body: b });
}
// 10 closing
{
  let b =
    rect(0, 0, 1600, 900, '#e9efdf', 0) +
    small(84, 135, 'CLARITY LEADS TO ACTION.') +
    txt(84, 264, '次の意思決定を、', 65, ink, 450) +
    txt(84, 366, 'ここから。', 65, ink, 450) +
    paragraphs(
      87,
      443,
      [
        '見るだけの画面から、問いが生まれる体験へ。',
        '気になるダッシュボードを、実際に触れてみてください。',
      ],
      19,
      '#839276',
      36,
    );
  const nav = [
    ['01', 'Retail'],
    ['02', 'Manufacturing'],
    ['03', 'Healthcare'],
    ['04', 'Finance'],
    ['05', 'AI Copilot'],
  ];
  nav.forEach(([n, t], i) => {
    const x = 87 + i * 290;
    b +=
      line(x, 592, x + 255, 592, '#bdcbb1') +
      small(x, 629, n, '#879b78') +
      txt(x, 678, t, 24, ink, 450) +
      arrow(x, 720, 45);
  });
  b += txt(
    87,
    806,
    'LUMENは架空データの独立したReact製プロトタイプです。TableauのWorkbookや埋め込みではありません。',
    12,
    '#8e9c81',
  );
  slides.push({ file: '10-closing', body: b });
}
// Subset local Noto CJK and embed it so each SVG is a standalone shareable artifact.
const allText =
  slides.map((s) => s.body.replace(/<[^>]+>/g, '')).join('') +
  'LUMEN ANALYTICS ATELIERDESIGN STORY0123456789/·';
await writeFile('docs/slide-characters.txt', allText);
execFileSync(
  'pyftsubset',
  [
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '--font-number=0',
    '--text-file=docs/slide-characters.txt',
    '--flavor=woff',
    '--output-file=public/slides/deck-font.woff',
    '--no-hinting',
  ],
  { stdio: 'pipe' },
);
const font = (await readFile('public/slides/deck-font.woff')).toString('base64');
for (let i = 0; i < slides.length; i++) {
  const s = slides[i],
    fg = s.dark ? '#adbf9e' : muted;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="900" viewBox="0 0 1600 900"><title>LUMEN — ${i + 1}: ${s.file}</title><defs><style>@font-face{font-family:Deck;src:url(data:font/woff;base64,${font}) format('woff');font-weight:100 900}text{font-family:Deck,'Noto Sans CJK JP',sans-serif}</style></defs>${s.dark ? '' : rect(0, 0, 1600, 900, cream, 0)}${s.body}${small(84, 52, 'LUMEN / ANALYTICS ATELIER', fg)}${small(1290, 52, 'DESIGN STORY / 2026', fg)}${line(84, 77, 1516, 77, s.dark ? '#415044' : border)}${txt(84, 869, 'INTERACTIVE CONCEPT COLLECTION · SYNTHETIC DATA', 9, fg, 400, 'letter-spacing="1"')}${txt(1470, 869, `${String(i + 1).padStart(2, '0')} / 10`, 10, fg)}</svg>`;
  await writeFile(`${out}/${s.file}.svg`, svg);
}
console.log(
  `Created ${slides.length} standalone SVG slides with embedded screenshots and subset font.`,
);
