import { useMemo, useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowDownToLine,
  ArrowDownUp,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ZAxis,
} from 'recharts';
import {
  configs,
  defaultFilters,
  format,
  groups,
  metrics,
  periodLabels,
  selectRows,
  series,
  sum,
  csv,
  latest,
  type Filters,
  type Industry,
  type Period,
} from './data';
import { chartColors, download, Kpi, Modal, Panel, Tip } from './components/UI';
const axis = { stroke: 'var(--muted)', fontSize: 10, axisLine: false, tickLine: false };
export default function Dashboard({ id }: { id: Industry }) {
  const c = configs[id];
  const [filters, setFilters] = useState<Filters>(() => {
      const q = new URLSearchParams(location.hash.split('?')[1] || '');
      return {
        period: ['ytd', 'quarter', 'month'].includes(q.get('period') || '')
          ? (q.get('period') as Period)
          : 'ytd',
        region: c.regions.includes(q.get('region') || '') ? q.get('region')! : 'すべて',
        category: c.categories.includes(q.get('category') || '') ? q.get('category')! : 'すべて',
      };
    }),
    [comparison, setComparison] = useState(true),
    [info, setInfo] = useState(false),
    [detail, setDetail] = useState<string | null>(() => {
      const d = new URLSearchParams(location.hash.split('?')[1] || '').get('detail');
      return c.categories.includes(d || '') ? d : null;
    }),
    [saved, setSaved] = useState(false),
    [toast, setToast] = useState(''),
    [sort, setSort] = useState<'actual' | 'growth'>('actual');
  const rows = useMemo(() => selectRows(id, filters), [id, filters]),
    m = useMemo(() => metrics(id, rows), [id, rows]),
    trend = useMemo(() => series(rows), [rows]);
  const regions = useMemo(() => groups(rows, 'region', id), [rows, id]);
  const categories = useMemo(() => groups(rows, 'category', id), [rows, id]);
  const set = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };
  const choose = (name: string) => set('category', filters.category === name ? 'すべて' : name);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3000);
  };
  const closeInfo = useCallback(() => setInfo(false), []),
    closeDetail = useCallback(() => setDetail(null), []);
  const save = () => {
    try {
      localStorage.setItem(`lumen-view-${id}`, JSON.stringify(filters));
      setSaved(true);
      notify('現在のフィルターを、このブラウザに保存しました');
    } catch {
      notify('このブラウザでは条件を保存できません');
    }
  };
  const restore = () => {
    try {
      const v = JSON.parse(localStorage.getItem(`lumen-view-${id}`) || 'null');
      if (
        v &&
        ['ytd', 'quarter', 'month'].includes(v.period) &&
        ['すべて', ...c.regions].includes(v.region) &&
        ['すべて', ...c.categories].includes(v.category)
      ) {
        setFilters(v);
        notify('保存した条件を復元しました');
      } else notify('保存された条件はまだありません');
    } catch {
      notify('保存条件を読み込めませんでした');
    }
  };
  const active =
    filters.region !== 'すべて' || filters.category !== 'すべて' || filters.period !== 'ytd';
  const sorted = [...categories].sort((a, b) => b[sort] - a[sort]);
  const detailRows = detail ? rows.filter((r) => r.category === detail) : [];
  return (
    <div className={`dashboard page-enter ${id}`} style={{ '--accent': c.accent } as CSSProperties}>
      <header className="page-heading">
        <div>
          <span className="eyebrow">
            <span className="tiny-line" />
            {c.eyebrow} <span className="eyebrow-index">/ {c.index}</span>
          </span>
          <h1>
            {c.en}
            <span className="heading-dot">.</span>
          </h1>
          <p>{c.subtitle}</p>
        </div>
        <div className="heading-actions">
          <button className="button subtle" onClick={save}>
            <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
            {saved ? '保存済み' : 'ビューを保存'}
          </button>
          <button
            className="button export-button"
            onClick={() => {
              download(`lumen-${id}-${filters.period}.csv`, csv(rows), 'text/csv;charset=utf-8');
              notify(`${rows.length}件の明細をCSV出力しました`);
            }}
          >
            <ArrowDownToLine size={15} />
            CSV出力
          </button>
        </div>
      </header>
      <div className="filterbar">
        <span className="filter-icon">
          <SlidersHorizontal size={16} />
        </span>
        <label className="filter-select">
          <span>期間</span>
          <select
            aria-label="期間"
            value={filters.period}
            onChange={(e) => set('period', e.target.value as Period)}
          >
            {Object.entries(periodLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
        <span className="filter-divider" />
        <label className="filter-select">
          <span>{c.regionLabel}</span>
          <select
            aria-label={c.regionLabel}
            value={filters.region}
            onChange={(e) => set('region', e.target.value)}
          >
            {['すべて', ...c.regions].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
        <span className="filter-divider" />
        <label className="filter-select">
          <span>{c.categoryLabel}</span>
          <select
            aria-label={c.categoryLabel}
            value={filters.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {['すべて', ...c.categories].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
        <div className="filter-tools">
          <button
            className="reset-button"
            onClick={() => {
              setFilters(defaultFilters);
              setSaved(false);
            }}
            disabled={!active}
          >
            <RotateCcw size={13} />
            リセット
          </button>
          <button
            className="icon-button"
            title="保存ビューを復元"
            aria-label="保存ビューを復元"
            onClick={restore}
          >
            <Bookmark size={14} />
          </button>
          <button
            className="icon-button"
            title="データ定義"
            aria-label="データ定義"
            onClick={() => setInfo(true)}
          >
            <Info size={15} />
          </button>
        </div>
      </div>
      <div className="dashboard-caption">
        <span>
          <span className="live-dot" />
          {periodLabels[filters.period]} <span className="caption-divider">/</span>{' '}
          {filters.region === 'すべて' ? `全${c.regions.length}${c.regionLabel}` : filters.region}
          {filters.category !== 'すべて' ? ` · ${filters.category}` : ''}
        </span>
        <span>
          最終データ: 2026.10.31 <span className="sample-label">SYNTHETIC DATA</span>
        </span>
      </div>
      <div className="kpi-grid">
        {id === 'retail' ? (
          <>
            <Kpi
              label="総売上"
              value={format(m.actual / 100, 2)}
              unit="億円"
              change={`+${format(m.growth, 1)}%`}
              spark={trend.map((x) => x.actual)}
            />
            <Kpi
              label="粗利益率"
              value={format(m.margin, 1)}
              unit="%"
              change={`${format(m.margin - 30, 1)}pt`}
              caption="基準値 30%との差"
              spark={trend.map((x) => x.margin)}
            />
            <Kpi
              label="購入点数"
              value={format(m.volume)}
              unit="点"
              change={`+${format(m.growth, 1)}%`}
              spark={trend.map((x) => x.volume)}
            />
            <Kpi
              label="予算達成率"
              value={format((m.actual / m.target) * 100, 1)}
              unit="%"
              change={`${format((m.actual / m.target - 1) * 100, 1)}%`}
              positive={m.actual >= m.target}
              caption="計画比"
              spark={trend.map((x) => (x.actual / x.target) * 100)}
            />
          </>
        ) : id === 'manufacturing' ? (
          <>
            <Kpi
              label="総合設備効率 / OEE"
              value={format(m.oee, 1)}
              unit="%"
              change={`${format(m.oee - 85, 1)}pt`}
              positive={m.oee >= 85}
              caption="目標 85%との差"
              spark={trend.map((x) => x.oee)}
            />
            <Kpi
              label="生産実績"
              value={format(m.actual)}
              unit="個"
              change={`+${format(m.growth, 1)}%`}
              spark={trend.map((x) => x.actual)}
            />
            <Kpi
              label="良品率"
              value={format(m.quality, 2)}
              unit="%"
              change={`${format(m.quality - 98, 2)}pt`}
              positive={m.quality >= 98}
              caption="目標 98%との差"
              spark={trend.map((x) => x.quality)}
            />
            <Kpi
              label="設備停止時間"
              value={format(sum(rows, 'downtime'), 1)}
              unit="h"
              change={`${format(sum(rows, 'downtime') / rows.length, 1)}h`}
              positive={false}
              caption="ライン・月あたり平均"
              spark={trend.map((x) => x.downtime)}
            />
          </>
        ) : id === 'healthcare' ? (
          <>
            <Kpi
              label="延べ来院数"
              value={format(m.actual)}
              unit="人"
              change={`+${format(m.growth, 1)}%`}
              spark={trend.map((x) => x.actual)}
            />
            <Kpi
              label="平均待ち時間"
              value={format(m.wait, 1)}
              unit="分"
              change={`${format(m.wait - 30, 1)}分`}
              positive={m.wait <= 30}
              caption="目標 30分との差"
              spark={trend.map((x) => x.wait)}
            />
            <Kpi
              label="診療完了率"
              value={format((m.volume / m.actual) * 100, 1)}
              unit="%"
              change={`${format((m.volume / m.actual) * 100 - 85, 1)}pt`}
              caption="目標 85%との差"
              spark={trend.map((x) => (x.volume / x.actual) * 100)}
            />
            <Kpi
              label="診療科あたり来院数"
              value={format(m.actual / categories.length)}
              unit="人"
              change={`${categories.length}診療科`}
              caption="選択中の診療科"
              spark={trend.map((x) => x.actual / categories.length)}
            />
          </>
        ) : (
          <>
            <Kpi
              label="運用資産残高 / AUM"
              value={format(m.actual / 100, 2)}
              unit="億円"
              change={`+${format(m.growth, 1)}%`}
              spark={trend.map((x) => x.actual)}
              caption="前年同月比"
            />
            <Kpi
              label="加重平均リターン"
              value={`+${format(m.returnRate, 2)}`}
              unit="%"
              change="参考値"
              caption="保有資産の加重平均"
              spark={trend.map((x) => x.returnRate)}
            />
            <Kpi
              label="年率リスク"
              value={format(m.risk, 2)}
              unit="%"
              change={m.risk <= 15 ? '範囲内' : '要確認'}
              positive={m.risk <= 15}
              caption="許容目安 15%"
              spark={trend.map((x) => x.risk)}
            />
            <Kpi
              label="アクティブ資産クラス"
              value={String(categories.length).padStart(2, '0')}
              unit="クラス"
              change={`${regions.length}市場`}
              caption="選択中の分散先"
              spark={trend.map(() => categories.length)}
            />
          </>
        )}
      </div>
      {id === 'retail' && (
        <>
          <div className="viz-grid primary-viz">
            <Panel
              title="売上トレンド"
              subtitle={`月次実績と前年の比較 / ${c.unit}`}
              action={<Compare checked={comparison} onChange={setComparison} />}
            >
              <TrendChart rows={trend} comparison={comparison} id={id} />
              <div className="chart-insight">
                <span>↗</span> {c.title}
                <span className="chart-legend">
                  <i />
                  実績
                  <i className="secondary" />
                  前年
                </span>
              </div>
            </Panel>
            <Panel
              title="エリア別パフォーマンス"
              subtitle="エリアを選択して、全体を絞り込み"
              action={<span className="small-tag">CROSS FILTER</span>}
            >
              <JapanMap
                regions={regions}
                selected={filters.region}
                onSelect={(name) => set('region', filters.region === name ? 'すべて' : name)}
              />
              <div className="region-list">
                {regions.map((r, i) => (
                  <button
                    key={r.name}
                    onClick={() => set('region', filters.region === r.name ? 'すべて' : r.name)}
                  >
                    <span>
                      <i style={{ background: chartColors[i] }} />
                      {r.name}
                    </span>
                    <b>¥{format(r.actual / 100, 2)}億</b>
                    <small className="up">+{format(r.growth, 1)}%</small>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
          <div className="viz-grid secondary-viz">
            <Panel title="カテゴリー構成" subtitle="商品をクリックして、分析の視点を切り替え">
              <div className="treemap">
                {categories.map((g, i) => (
                  <button
                    key={g.name}
                    style={{ background: chartColors[i], flex: g.actual }}
                    onClick={() => choose(g.name)}
                    aria-label={`${g.name}で絞り込む`}
                  >
                    <span>{g.name}</span>
                    <b>
                      {format((g.actual / m.actual) * 100, 1)}
                      <small>%</small>
                    </b>
                    <small>¥{format(g.actual)}百万円</small>
                  </button>
                ))}
              </div>
            </Panel>
            <Panel title="成長をつくる商品" subtitle="前年同期比の伸びを比較">
              <Ranking groups={categories} onSelect={choose} unit="百万円" />
            </Panel>
          </div>
        </>
      )}
      {id === 'manufacturing' && (
        <>
          <div className="viz-grid factory-primary">
            <Panel
              title="Equipment effectiveness"
              subtitle="OEE = 時間稼働率 × 性能稼働率 × 良品率"
              action={
                <span className="status-badge">
                  <i />
                  MONITORING
                </span>
              }
            >
              <div className="oee-layout">
                <Gauge value={m.oee} label="OVERALL OEE" target={85} />
                <div className="oee-factors">
                  {[
                    ['時間稼働率', m.availability],
                    ['性能稼働率', m.performance],
                    ['良品率', m.quality],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>
                        {format(Number(value), 1)}
                        <small>%</small>
                      </strong>
                      <div className="meter">
                        <i style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel
              title="生産実績 / 計画"
              subtitle="月別の生産数と計画値 / 個"
              action={
                <span className="chart-legend">
                  <i />
                  実績
                  <i className="secondary" />
                  計画
                </span>
              }
            >
              <ResponsiveContainer width="100%" height={252}>
                <ComposedChart data={trend} margin={{ top: 20, right: 10, left: 5, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--grid)" />
                  <XAxis dataKey="name" {...axis} />
                  <YAxis {...axis} width={48} tickFormatter={(n) => `${Math.round(n / 1000)}k`} />
                  <Tooltip content={<Tip />} />
                  <Bar
                    dataKey="actual"
                    name="実績"
                    fill="var(--accent)"
                    radius={[3, 3, 0, 0]}
                    barSize={22}
                  />
                  <Line
                    dataKey="target"
                    name="計画"
                    stroke="#8aa0b6"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="viz-grid secondary-viz">
            <Panel title="品質ロスの内訳" subtitle="不良の要因構成 / サンプル分類モデル">
              <CauseBars total={m.defects} />
            </Panel>
            <Panel title="ライン別パフォーマンス" subtitle="選択したラインに、すべての指標が連動">
              <Ranking groups={categories} onSelect={choose} unit="個" quality />
            </Panel>
          </div>
        </>
      )}
      {id === 'healthcare' && (
        <>
          <div className="viz-grid hospital-primary">
            <Panel
              title="Patient journey"
              subtitle="来院から診療完了まで / フロー配分はサンプルモデル"
              action={<span className="small-tag">PATIENT FLOW</span>}
            >
              <PatientFlow total={m.actual} complete={m.volume} />
            </Panel>
            <Panel title="来院と待ち時間" subtitle="来院数（左軸）・平均待ち時間 分（右軸）">
              <ResponsiveContainer width="100%" height={266}>
                <ComposedChart data={trend} margin={{ top: 25, left: 0, right: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--grid)" />
                  <XAxis dataKey="name" {...axis} />
                  <YAxis {...axis} width={38} tickFormatter={(n) => `${Math.round(n / 1000)}k`} />
                  <YAxis yAxisId="wait" orientation="right" {...axis} width={28} domain={[0, 60]} />
                  <Tooltip content={<Tip />} />
                  <Bar
                    dataKey="actual"
                    name="来院数"
                    fill="#a8d7ca"
                    radius={[3, 3, 0, 0]}
                    barSize={18}
                  />
                  <Line
                    yAxisId="wait"
                    dataKey="wait"
                    name="待ち時間"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Panel>
          </div>
          <div className="viz-grid secondary-viz">
            <Panel title="診療科 × 月の混雑傾向" subtitle="来院数 / セルの色の濃さで負荷を把握">
              <Heatmap rows={rows} categories={c.categories} onSelect={choose} />
            </Panel>
            <Panel title="診療科別の待ち時間" subtitle="目標30分 / 診療科を選択して原因を探る">
              <div className="waiting-list">
                {categories.map((g, i) => (
                  <button key={g.name} onClick={() => choose(g.name)}>
                    <span className="department-icon">0{i + 1}</span>
                    <div>
                      <span>{g.name}</span>
                      <div className="wait-meter">
                        <i
                          style={{
                            width: `${(g.wait / 60) * 100}%`,
                            background: g.wait > 30 ? '#c9975e' : 'var(--accent)',
                          }}
                        />
                        <b style={{ left: '50%' }} />
                      </div>
                    </div>
                    <strong>
                      {format(g.wait, 1)}
                      <small>分</small>
                    </strong>
                    <span className={`small-tag ${g.wait > 30 ? 'amber' : ''}`}>
                      {g.wait > 30 ? '要改善' : '目標内'}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
      {id === 'finance' && (
        <>
          <div className="viz-grid finance-primary">
            <Panel
              title="資産価値の推移"
              subtitle="月末残高 / 百万円"
              action={<Compare checked={comparison} onChange={setComparison} />}
            >
              <TrendChart rows={trend} comparison={comparison} id={id} />
              <div className="chart-insight">
                <span>↗</span>Perspective beyond the numbers.
                <span className="chart-legend">
                  <i />
                  残高
                  <i className="secondary" />
                  前年同月
                </span>
              </div>
            </Panel>
            <Panel title="Asset allocation" subtitle="資産クラスを選択して全体を絞り込み">
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={218}>
                  <PieChart>
                    <Pie
                      data={categories}
                      dataKey="actual"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={93}
                      paddingAngle={3}
                      stroke="none"
                      onClick={(_, i) => choose(categories[i].name)}
                      style={{ cursor: 'pointer' }}
                    >
                      {categories.map((g, i) => (
                        <Cell key={g.name} fill={chartColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-label">
                  <small>TOTAL ASSETS</small>
                  <strong>
                    {format(m.actual / 100, 1)}
                    <small>億円</small>
                  </strong>
                </div>
              </div>
              <div className="allocation-list">
                {categories.map((g, i) => (
                  <button key={g.name} onClick={() => choose(g.name)}>
                    <span>
                      <i style={{ background: chartColors[i] }} />
                      {g.name}
                    </span>
                    <b>{format((g.actual / m.actual) * 100, 1)}%</b>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
          <div className="viz-grid finance-secondary">
            <Panel
              title="Risk / Return landscape"
              subtitle="リスクとリターンの関係 / バブルサイズ = 資産残高"
            >
              <ResponsiveContainer width="100%" height={226}>
                <ScatterChart margin={{ top: 15, left: 0, right: 20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--grid)" />
                  <XAxis
                    {...axis}
                    type="number"
                    dataKey="risk"
                    name="年率リスク"
                    unit="%"
                    domain={[0, 30]}
                  />
                  <YAxis
                    {...axis}
                    type="number"
                    dataKey="returnRate"
                    name="リターン"
                    unit="%"
                    width={42}
                    domain={[0, 20]}
                  />
                  <ZAxis type="number" dataKey="actual" range={[180, 1500]} />
                  <ReferenceLine x={15} stroke="var(--muted)" strokeDasharray="3 5" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<Tip />} />
                  <Scatter
                    data={categories}
                    onClick={(_, i) => {
                      if (categories[i]) choose(categories[i].name);
                    }}
                  >
                    {categories.map((g, i) => (
                      <Cell
                        key={g.name}
                        fill={chartColors[i]}
                        fillOpacity={0.75}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="chart-axis-note">
                ← 安定性を重視 <span>成長性を重視 →</span>
              </div>
            </Panel>
            <Panel title="市場エクスポージャー" subtitle="市場ごとの保有資産比率">
              <div className="market-list">
                {regions.map((g, i) => (
                  <button
                    key={g.name}
                    onClick={() => set('region', filters.region === g.name ? 'すべて' : g.name)}
                  >
                    <span className="market-code">
                      {['JP', 'US', 'EU', 'EM'][c.regions.indexOf(g.name)]}
                    </span>
                    <div>
                      <span>{g.name}</span>
                      <div className="meter">
                        <i
                          style={{
                            width: `${(g.actual / m.actual) * 100}%`,
                            background: chartColors[i],
                          }}
                        />
                      </div>
                    </div>
                    <strong>
                      {format((g.actual / m.actual) * 100, 1)}
                      <small>%</small>
                    </strong>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
      <Panel
        title={id === 'finance' ? '資産クラス別 明細' : `${c.categoryLabel}別 明細`}
        subtitle={
          id === 'finance'
            ? '期間末の残高を表示 / 行を選択して詳細を確認'
            : '行を選択して詳細を確認'
        }
        className="detail-panel"
        action={
          <button
            className="text-button"
            onClick={() => setSort((s) => (s === 'actual' ? 'growth' : 'actual'))}
          >
            <ArrowDownUp size={13} />
            {sort === 'actual' ? '実績順' : '成長率順'}
          </button>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{c.categoryLabel}</th>
                <th>
                  {c.valueLabel}（{c.unit}）
                </th>
                <th>前年同期比</th>
                <th>
                  {id === 'healthcare'
                    ? '平均待ち時間'
                    : id === 'manufacturing'
                      ? '良品率'
                      : id === 'finance'
                        ? '加重リターン'
                        : '粗利益率'}
                </th>
                <th>構成比</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map((g, i) => (
                <tr key={g.name}>
                  <td>
                    <button onClick={() => setDetail(g.name)}>
                      <i className="table-dot" style={{ background: chartColors[i] }} />
                      {g.name}
                    </button>
                  </td>
                  <td>{format(g.actual, id === 'retail' || id === 'finance' ? 1 : 0)}</td>
                  <td className="up">+{format(g.growth, 1)}%</td>
                  <td>
                    {format(
                      id === 'healthcare'
                        ? g.wait
                        : id === 'manufacturing'
                          ? g.quality
                          : id === 'finance'
                            ? g.returnRate
                            : g.margin,
                      1,
                    )}
                    {id === 'healthcare' ? '分' : '%'}
                  </td>
                  <td>
                    <span className="table-share">
                      <i style={{ width: `${(g.actual / m.actual) * 100}%` }} />
                    </span>
                    {format((g.actual / m.actual) * 100, 1)}%
                  </td>
                  <td>
                    <button
                      aria-label={`${g.name}の詳細を開く`}
                      className="icon-button"
                      onClick={() => setDetail(g.name)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>
            {rows.length}件の月次レコードを集計 <span>·</span> {categories.length}カテゴリー
          </span>
          <button
            className="text-button"
            onClick={() => {
              download(`lumen-${id}-detail.csv`, csv(rows), 'text/csv');
              notify('集計元データを出力しました');
            }}
          >
            元データを取得
            <ArrowRight size={13} />
          </button>
        </div>
      </Panel>
      <div className="dashboard-bottom-note">
        <span>
          <Check size={13} />
          グラフ間の連動フィルターが有効
        </span>
        <span>Designed for clarity. Built for exploration.</span>
      </div>
      {toast && (
        <div role="status" className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
      {info && (
        <Modal title="データと指標の定義" onClose={closeInfo}>
          <div className="prose">
            <p>
              2026年1–10月の架空の月次サンプルデータです。各業種160レコード（10か月 × 4拠点 ×
              4区分）。全フィルターはKPI・図表・明細・CSVに連動します。
            </p>
            <h3>{c.en}</h3>
            <p>
              {id === 'retail'
                ? '売上・前年売上・計画・コストは百万円。粗利益率 =（売上 − コスト）÷ 売上。購入点数は同じレコードの数量を合計。'
                : id === 'manufacturing'
                  ? 'OEE = 時間稼働率 × 性能稼働率 × 良品率。各レコードの予定時間は160時間。時間稼働率 = 1 − 停止時間 ÷ 予定時間。性能稼働率 = 生産実績 ÷ 計画（最大100%）。良品率 = 1 − 不良数 ÷ 生産実績。品質ロス要因の配分は説明用モデル。'
                  : id === 'healthcare'
                    ? '来院数は延べ人数。待ち時間は来院数による加重平均。診療完了率 = 完了数 ÷ 来院数。患者フローの経路は説明用の固定比率モデル。混雑セルは選択中データの月別来院数。'
                    : '運用資産は選択期間の最終月の残高です。リターンと年率リスクは資産残高による加重平均。相関を考慮するポートフォリオリスクや実現リターンではありません。前年は同月の架空比較値です。'}
            </p>
            <h3>Tableau風の操作体験</h3>
            <p>
              選択フィルター、マークからの絞り込み、ツールチップ、比較表示、明細への掘り下げ、CSV、ビュー保存。Tableau本体や実データ接続は含みません。
            </p>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal title={`${detail} — 詳細分析`} onClose={closeDetail} wide>
          <div className="detail-summary">
            <span className="eyebrow">
              {periodLabels[filters.period]} / {filters.region}
            </span>
            <h3>
              {c.valueLabel}{' '}
              <strong>
                {format(metrics(id, detailRows).actual, 1)}
                <small>{c.unit}</small>
              </strong>
            </h3>
            <TrendChart rows={series(detailRows)} comparison id={`${id}-detail`} />
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>月</th>
                    <th>{c.regionLabel}</th>
                    <th>実績</th>
                    <th>前年</th>
                    <th>計画</th>
                  </tr>
                </thead>
                <tbody>
                  {(id === 'finance' ? latest(detailRows) : detailRows).map((r) => (
                    <tr key={r.id}>
                      <td>{r.month}月</td>
                      <td>{r.region}</td>
                      <td>{format(r.actual, 1)}</td>
                      <td>{format(r.previous, 1)}</td>
                      <td>{format(r.target, 1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="button primary"
              onClick={() => {
                choose(detail);
                setDetail(null);
              }}
            >
              この{c.categoryLabel}で絞り込む
              <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Compare({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="compare">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle" />
      前年と比較
    </label>
  );
}
function TrendChart({
  rows,
  comparison,
  id,
}: {
  rows: ReturnType<typeof series>;
  comparison: boolean;
  id: string;
}) {
  return (
    <div className="trend-chart">
      <ResponsiveContainer width="100%" height={252}>
        <AreaChart data={rows} margin={{ top: 20, left: 0, right: 18, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="1" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 4" />
          <XAxis dataKey="name" {...axis} dy={8} />
          <YAxis
            {...axis}
            width={45}
            tickFormatter={(n) => (n >= 1000 ? `${format(n / 1000, 1)}k` : format(n))}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<Tip />} />
          {comparison && (
            <Area
              type="monotone"
              dataKey="previous"
              name="前年"
              stroke="#9ca9ad"
              strokeWidth={1.5}
              strokeDasharray="4 5"
              fill="transparent"
            />
          )}
          <Area
            type="monotone"
            dataKey="actual"
            name="実績"
            stroke="var(--accent)"
            strokeWidth={2.7}
            fill={`url(#gradient-${id})`}
            activeDot={{ r: 5, strokeWidth: 3, stroke: 'var(--panel)' }}
            dot={rows.length === 1 ? { r: 5 } : false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
function JapanMap({
  regions,
  selected,
}: {
  regions: ReturnType<typeof groups>;
  selected: string;
  onSelect: (s: string) => void;
}) {
  const tiles = [
    [14, 0],
    [15, 0],
    [13, 1],
    [14, 1],
    [15, 1],
    [13, 2],
    [14, 2],
    [12, 4],
    [12, 5],
    [11, 6],
    [12, 6],
    [10, 7],
    [11, 7],
    [10, 8],
    [11, 8],
    [9, 9],
    [10, 9],
    [8, 10],
    [9, 10],
    [10, 10],
    [7, 10],
    [7, 11],
    [8, 11],
    [9, 11],
    [5, 11],
    [6, 11],
    [5, 12],
    [6, 12],
    [7, 12],
    [4, 12],
    [4, 13],
    [5, 13],
    [3, 13],
    [3, 14],
    [4, 14],
    [2, 14],
    [1, 14],
    [1, 15],
    [2, 15],
    [1, 16],
    [2, 16],
    [1, 17],
    [2, 17],
    [5, 14],
    [6, 14],
    [6, 13],
    [0, 19],
  ];
  const names = ['九州', '関西', '中部', '関東'];
  return (
    <div className="japan-map">
      <svg
        viewBox="0 0 380 220"
        role="img"
        aria-label="日本のタイル概略地図。地域名のボタンで絞り込みできます"
      >
        <g transform="translate(70 8)">
          {tiles.map(([x, y], i) => {
            const region = i < 17 ? '関東' : i < 25 ? '中部' : i < 34 || i > 42 ? '関西' : '九州';
            const idx = names.indexOf(region),
              isActive = regions.some((r) => r.name === region);
            return (
              <rect
                key={i}
                x={x * 13}
                y={y * 9}
                width="10"
                height="6"
                rx="1.3"
                fill={isActive ? ['#a8bcb3', '#8aa99e', '#d3b599', '#c26650'][idx] : 'var(--grid)'}
                opacity={selected === 'すべて' || selected === region ? 1 : 0.25}
              />
            );
          })}
          <path
            d="M125 75H55V54M73 120H35V100M55 143H-10V126"
            fill="none"
            stroke="var(--grid)"
            strokeWidth="1"
          />
        </g>
        <text x="22" y="56" fill="var(--muted)" fontSize="8" letterSpacing="2">
          JAPAN
        </text>
        <text x="287" y="188" fill="var(--muted)" fontSize="8">
          AREA OVERVIEW
        </text>
      </svg>
      <span className="map-disclaimer">エリア概略図</span>
    </div>
  );
}
function Ranking({
  groups: gg,
  onSelect,
  unit,
  quality = false,
}: {
  groups: ReturnType<typeof groups>;
  onSelect: (s: string) => void;
  unit: string;
  quality?: boolean;
}) {
  const max = Math.max(...gg.map((g) => g.actual));
  return (
    <div className="ranking">
      {gg.map((g, i) => (
        <button key={g.name} onClick={() => onSelect(g.name)}>
          <div className="ranking-label">
            <span>
              <small>0{i + 1}</small>
              {g.name}
            </span>
            <b>
              {format(quality ? g.quality : g.growth, 1)}
              <small>{quality ? '% 良品率' : '% ↑'}</small>
            </b>
          </div>
          <div className="ranking-track">
            <i style={{ width: `${(g.actual / max) * 100}%`, background: chartColors[i] }} />
            <span>
              {format(g.actual)} {unit}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
function Gauge({ value, label, target }: { value: number; label: string; target: number }) {
  const r = 76,
    circumference = 2 * Math.PI * r;
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${label} ${format(value, 1)}%`}>
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--grid)" strokeWidth="11" />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${(circumference * value) / 100} ${circumference}`}
          transform="rotate(-90 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r="63"
          fill="none"
          stroke="var(--grid)"
          strokeWidth=".5"
          strokeDasharray="1 5"
        />
      </svg>
      <div>
        <small>{label}</small>
        <strong>
          {format(value, 1)}
          <span>%</span>
        </strong>
        <p>目標 {target}%</p>
      </div>
    </div>
  );
}
function CauseBars({ total }: { total: number }) {
  const causes = [
    ['寸法不良', 0.38],
    ['外観不良', 0.29],
    ['組立不良', 0.21],
    ['その他', 0.12],
  ] as const;
  const counts = causes.map(([, p]) => Math.floor(total * p));
  counts[3] += total - counts.reduce((a, b) => a + b, 0);
  return (
    <div className="cause-bars">
      {causes.map(([label, p], i) => (
        <div key={label}>
          <span>{label}</span>
          <div>
            <i style={{ width: `${(p / 0.38) * 100}%`, opacity: 1 - i * 0.18 }} />
          </div>
          <strong>
            {format(counts[i])}
            <small>個</small>
          </strong>
          <span>{Math.round(p * 100)}%</span>
        </div>
      ))}
      <p>
        <span className="amber-dot" />
        上位2要因が品質ロスの67%を占める配分モデル
      </p>
    </div>
  );
}
function PatientFlow({ total, complete }: { total: number; complete: number }) {
  return (
    <div className="patient-flow">
      <svg
        viewBox="0 0 650 255"
        role="img"
        aria-label={`来院${format(total)}人から診療完了${format(complete)}人へのサンプル患者フロー`}
      >
        <defs>
          <linearGradient id="flow-fill">
            <stop stopColor="#bcded3" />
            <stop offset="1" stopColor="#62ad98" />
          </linearGradient>
        </defs>
        <path
          d="M50 48C140 48 135 43 220 43V171C135 171 140 195 50 195Z"
          fill="url(#flow-fill)"
          opacity=".32"
        />
        <path
          d="M234 43C310 43 315 40 395 40V129C315 129 310 135 234 135Z"
          fill="url(#flow-fill)"
          opacity=".42"
        />
        <path
          d="M234 140C310 140 315 177 395 177V218C315 218 310 174 234 174Z"
          fill="#d6b997"
          opacity=".4"
        />
        <path
          d="M409 40C500 40 490 56 590 56V173C490 173 500 129 409 129Z"
          fill="url(#flow-fill)"
          opacity=".57"
        />
        <path
          d="M409 177C500 177 500 139 590 139V173C500 173 500 218 409 218Z"
          fill="#8ebfae"
          opacity=".55"
        />
        {[
          [40, 48, 147, '受付', total, '#b7d9cb'],
          [220, 43, 131, '外来診察', total, '#92c6b3'],
          [395, 40, 89, '一般診療', Math.round(total * 0.63), '#6faf98'],
          [395, 177, 41, '検査・処置', total - Math.round(total * 0.63), '#c5a17a'],
          [590, 56, 117, '診療完了', complete, '#258c73'],
        ].map(([x, y, h, t, n, color]) => (
          <g key={String(t)}>
            <rect
              x={Number(x)}
              y={Number(y)}
              width="14"
              height={Number(h)}
              rx="3"
              fill={String(color)}
            />
            <text
              x={Number(x) - 2}
              y={Number(y) - 16}
              fill="var(--text)"
              fontSize="11"
              fontWeight="600"
            >
              {t}
            </text>
            <text
              x={Number(x) - 2}
              y={Number(y) + Number(h) + 22}
              fill="var(--text)"
              fontSize="16"
              fontWeight="500"
            >
              {format(Number(n))}
            </text>
          </g>
        ))}
      </svg>
      <div className="patient-flow-caption">
        <span>
          <i />
          外来・一般診療
        </span>
        <span>
          <i className="amber-dot" />
          検査・処置
        </span>
        <span>経路は説明用 · 継続中 {format(total - complete)}人</span>
      </div>
    </div>
  );
}
function Heatmap({
  rows,
  categories,
  onSelect,
}: {
  rows: ReturnType<typeof selectRows>;
  categories: string[];
  onSelect: (s: string) => void;
}) {
  const months = Array.from(new Set(rows.map((r) => r.month)));
  const values = categories.flatMap((c) =>
    months.map((m) =>
      sum(
        rows.filter((r) => r.month === m && r.category === c),
        'actual',
      ),
    ),
  );
  const max = Math.max(...values);
  return (
    <div className="heatmap">
      <div className="heatmap-row">
        <span />
        {months.map((m) => (
          <small key={m}>{m}月</small>
        ))}
      </div>
      {categories.map((cat) => (
        <div key={cat} className="heatmap-row">
          <button className="heat-label" onClick={() => onSelect(cat)}>
            {cat}
          </button>
          {months.map((m) => {
            const v = sum(
              rows.filter((r) => r.month === m && r.category === cat),
              'actual',
            );
            return (
              <button
                key={m}
                onClick={() => onSelect(cat)}
                style={{
                  background: v ? `rgba(33,140,120,${0.1 + (v / max) * 0.8})` : 'var(--grid)',
                  color: v / max > 0.45 ? 'white' : 'var(--muted)',
                }}
                title={`${cat} ${m}月: ${format(v)}人`}
                aria-label={`${cat} ${m}月 ${format(v)}人。クリックで診療科を絞り込み`}
              >
                {format(v / 1000, 1)}
              </button>
            );
          })}
        </div>
      ))}
      <div className="heatmap-legend">
        単位: 千人 <span>少ない</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
          <i key={v} style={{ background: `rgba(33,140,120,${v})` }} />
        ))}
        <span>多い</span>
      </div>
    </div>
  );
}
