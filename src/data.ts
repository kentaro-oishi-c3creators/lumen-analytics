export type Industry = 'retail' | 'manufacturing' | 'healthcare' | 'finance';
export type Route = Industry | 'ai' | 'collection' | 'story';
export type Period = 'ytd' | 'quarter' | 'month';
export interface Filters {
  period: Period;
  region: string;
  category: string;
}
export interface Datum {
  id: string;
  month: number;
  region: string;
  category: string;
  actual: number;
  target: number;
  previous: number;
  cost: number;
  volume: number;
  defects: number;
  wait: number;
  risk: number;
  returnRate: number;
  downtime: number;
}
export interface IndustryConfig {
  id: Industry;
  index: string;
  en: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  accent: string;
  regions: string[];
  regionLabel: string;
  categories: string[];
  categoryLabel: string;
  unit: string;
  valueLabel: string;
  description: string;
  question: string;
  capability: string;
}
export const configs: Record<Industry, IndustryConfig> = {
  retail: {
    id: 'retail',
    index: '01',
    en: 'Retail intelligence',
    title: '売上の先に、顧客が見える。',
    subtitle: '売上と収益性を、あらゆる角度から。',
    eyebrow: 'RETAIL & COMMERCE',
    accent: '#c26650',
    regions: ['関東', '関西', '中部', '九州'],
    regionLabel: 'エリア',
    categories: ['アパレル', 'ビューティー', 'ホーム', 'フード'],
    categoryLabel: 'カテゴリー',
    unit: '百万円',
    valueLabel: '売上',
    description: '地域・商品・時間を横断して、成長の理由を探る。',
    question: 'どこで、何が売れているか？',
    capability: 'エリア × 商品のクロスフィルター',
  },
  manufacturing: {
    id: 'manufacturing',
    index: '02',
    en: 'Manufacturing control',
    title: '現場の変化を、見逃さない。',
    subtitle: '生産、品質、設備の状態をひとつの視界に。',
    eyebrow: 'MANUFACTURING & QUALITY',
    accent: '#f4ad6b',
    regions: ['愛知', '静岡', '大阪', '福岡'],
    regionLabel: '工場',
    categories: ['第1ライン', '第2ライン', '第3ライン', '第4ライン'],
    categoryLabel: '生産ライン',
    unit: '個',
    valueLabel: '生産数',
    description: '生産のボトルネックを見つけ、稼働と品質を整える。',
    question: '生産を止めている原因は何か？',
    capability: 'OEE分解 × 品質・停止分析',
  },
  healthcare: {
    id: 'healthcare',
    index: '03',
    en: 'Healthcare pulse',
    title: '数字の向こうに、患者がいる。',
    subtitle: '病院の流れを整え、ケアの時間をつくる。',
    eyebrow: 'HEALTHCARE & OPERATIONS',
    accent: '#218c78',
    regions: ['東京', '横浜', '大阪', '福岡'],
    regionLabel: '病院',
    categories: ['内科', '外科', '整形外科', '小児科'],
    categoryLabel: '診療科',
    unit: '人',
    valueLabel: '来院数',
    description: '来院と待ち時間の変化から、医療現場の負荷を読み解く。',
    question: '患者の待ち時間をどう減らすか？',
    capability: '診療科フィルター × 混雑ヒートマップ',
  },
  finance: {
    id: 'finance',
    index: '04',
    en: 'Portfolio perspective',
    title: 'リスクを捉え、次の機会へ。',
    subtitle: '資産とリスクを俯瞰する、投資のコントロールルーム。',
    eyebrow: 'FINANCE & INVESTMENT',
    accent: '#8c77c4',
    regions: ['国内', '米国', '欧州', '新興国'],
    regionLabel: '市場',
    categories: ['株式', '債券', 'REIT', '現金'],
    categoryLabel: '資産クラス',
    unit: '百万円',
    valueLabel: '運用資産',
    description: '資産配分とリスク・リターンの関係を、ひと目で捉える。',
    question: '成長と安定をどう両立するか？',
    capability: '資産配分 × リスク・リターン探索',
  },
};
export const industryIds = Object.keys(configs) as Industry[];
const round = (n: number) => Math.round(n * 100) / 100;
export const data: Record<Industry, Datum[]> = Object.fromEntries(
  industryIds.map((id, di) => [
    id,
    Array.from({ length: 160 }, (_, i) => {
      const month = Math.floor(i / 16) + 1,
        r = Math.floor((i % 16) / 4),
        c = i % 4;
      const factor = [1.38, 1.05, 0.81, 0.66][r] * [1.2, 0.98, 0.8, 0.65][c];
      const wave = 1 + Math.sin(month * 1.7 + r + c) * 0.055;
      let actual =
        id === 'retail'
          ? (48 + month * 2.8) * factor * wave
          : id === 'manufacturing'
            ? (6800 + month * 80) * factor * wave
            : id === 'healthcare'
              ? (970 + month * 21) * factor * wave
              : (310 + month * 8) * factor * wave;
      if (id === 'retail' && r === 1 && c === 0 && month >= 8) actual *= 0.84;
      if (id === 'manufacturing' && c === 2 && month >= 8) actual *= 0.88;
      actual *= (
        id === 'retail'
          ? [0.92, 0.89, 1.05, 0.98, 1.1, 1.02, 1.13, 1.05, 1.22, 1.18]
          : id === 'manufacturing'
            ? [0.94, 1.02, 0.98, 1.05, 1.01, 1.07, 1.03, 0.96, 1.02, 1.08]
            : id === 'healthcare'
              ? [1.06, 1.02, 1.13, 0.95, 0.98, 0.96, 1.08, 1.04, 1.1, 1.03]
              : [0.98, 1.01, 0.97, 1.04, 1.02, 1.07, 1.1, 1.04, 1.09, 1.12]
      )[month - 1];
      actual = id === 'retail' || id === 'finance' ? round(actual) : Math.round(actual);
      const defectRate =
        0.012 + (c === 2 ? 0.021 : 0.003) + Math.abs(Math.sin(month + r + c)) * 0.007;
      return {
        id: `${di}-${i}`,
        month,
        region: configs[id].regions[r],
        category: configs[id].categories[c],
        actual,
        target: round(actual * (id === 'manufacturing' ? 1.07 : 1.02 + Math.sin(r + c) * 0.07)),
        previous: round(actual / (1.08 + month * 0.006 + (c === 1 ? 0.07 : 0))),
        cost: round(actual * (0.59 + c * 0.055)),
        volume: Math.round(actual * (id === 'retail' ? 38 : id === 'healthcare' ? 0.88 : 0.92)),
        defects: Math.round(actual * defectRate),
        wait: round(18 + c * 4 + r * 2 + Math.sin(month) * 3 + (month >= 8 && c === 0 ? 9 : 0)),
        risk: round([16.8, 5.2, 12.6, 0.8][c] + r * 1.8),
        returnRate: round([12.4, 3.8, 7.3, 1.1][c] + r * 0.65 + month * 0.16),
        downtime: round(
          3 + c * 1.8 + Math.abs(Math.sin(month + r)) * 4 + (c === 2 && month >= 8 ? 5 : 0),
        ),
      };
    }),
  ]),
) as Record<Industry, Datum[]>;
export const defaultFilters: Filters = { period: 'ytd', region: 'すべて', category: 'すべて' };
export const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月'];
export const periodLabels: Record<Period, string> = {
  ytd: '2026年 1–10月',
  quarter: '2026年 第3四半期',
  month: '2026年 10月',
};
export function selectRows(id: Industry, f: Filters) {
  return data[id].filter(
    (d) =>
      (f.period === 'ytd' ||
        (f.period === 'quarter' ? d.month >= 7 && d.month <= 9 : d.month === 10)) &&
      (f.region === 'すべて' || d.region === f.region) &&
      (f.category === 'すべて' || d.category === f.category),
  );
}
export const sum = (
  rows: Datum[],
  key: keyof Pick<
    Datum,
    'actual' | 'target' | 'previous' | 'cost' | 'volume' | 'defects' | 'downtime'
  >,
) => rows.reduce((s, r) => s + r[key], 0);
export function latest(rows: Datum[]) {
  const m = Math.max(...rows.map((r) => r.month));
  return rows.filter((r) => r.month === m);
}
export function metrics(id: Industry, rows: Datum[]) {
  const basis = id === 'finance' ? latest(rows) : rows;
  const actual = sum(basis, 'actual'),
    previous = sum(basis, 'previous'),
    target = sum(basis, 'target');
  const weighted = (key: 'wait' | 'risk' | 'returnRate') =>
    actual ? basis.reduce((s, r) => s + r[key] * r.actual, 0) / actual : 0;
  const quality = actual ? 100 * (1 - sum(basis, 'defects') / actual) : 0;
  const availability = 100 * (1 - sum(rows, 'downtime') / (rows.length * 160 || 1));
  const performance = target ? Math.min(100, (actual / target) * 100) : 0;
  return {
    actual,
    previous,
    target,
    growth: previous ? (actual / previous - 1) * 100 : 0,
    margin: actual ? (1 - sum(basis, 'cost') / actual) * 100 : 0,
    volume: sum(basis, 'volume'),
    quality,
    availability,
    performance,
    oee: (availability * performance * quality) / 10000,
    wait: weighted('wait'),
    risk: weighted('risk'),
    returnRate: weighted('returnRate'),
    defects: sum(basis, 'defects'),
    cost: sum(basis, 'cost'),
  };
}
export function series(rows: Datum[]) {
  return Array.from(new Set(rows.map((r) => r.month)))
    .sort((a, b) => a - b)
    .map((m) => {
      const rr = rows.filter((r) => r.month === m);
      return {
        ...metrics('retail', rr),
        oee: metrics('manufacturing', rr).oee,
        downtime: sum(rr, 'downtime'),
        name: monthNames[m - 1],
        month: m,
        actual: round(sum(rr, 'actual')),
        previous: round(sum(rr, 'previous')),
        target: round(sum(rr, 'target')),
        quality: round(100 * (1 - sum(rr, 'defects') / (sum(rr, 'actual') || 1))),
        wait: round(rr.reduce((s, r) => s + r.wait * r.actual, 0) / (sum(rr, 'actual') || 1)),
      };
    });
}
export function groups(rows: Datum[], key: 'region' | 'category', id: Industry) {
  return Array.from(new Set(rows.map((r) => r[key])))
    .map((name) => {
      const rr = rows.filter((r) => r[key] === name);
      return { name, ...metrics(id, rr) };
    })
    .sort((a, b) => b.actual - a.actual);
}
export const format = (n: number, digits = 0) =>
  new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
export function csv(rows: Datum[]) {
  const header = [
    'ID',
    '月',
    '拠点・市場',
    '区分',
    '実績',
    '計画',
    '前年',
    'コスト',
    '数量',
    '不良数',
    '待ち時間（分）',
    'リスク（%）',
    'リターン（%）',
    '停止（時間）',
  ];
  return (
    '\uFEFF' +
    [
      header.join(','),
      ...rows.map((r) =>
        [
          r.id,
          `2026-${String(r.month).padStart(2, '0')}`,
          r.region,
          r.category,
          r.actual,
          r.target,
          r.previous,
          r.cost,
          r.volume,
          r.defects,
          r.wait,
          r.risk,
          r.returnRate,
          r.downtime,
        ].join(','),
      ),
    ].join('\r\n')
  );
}
