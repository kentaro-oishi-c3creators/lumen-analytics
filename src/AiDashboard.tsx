import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  Lightbulb,
  LoaderCircle,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { defaultFilters, format, groups, metrics, selectRows, series } from './data';
import { download, Kpi, Modal, Panel, Tip } from './components/UI';
interface Message {
  role: 'user' | 'assistant';
  text: string;
  source?: 'demo' | 'claude';
  evidence?: boolean;
}
export default function AiDashboard() {
  const [region, setRegion] = useState('すべて'),
    [demand, setDemand] = useState(8),
    [price, setPrice] = useState(2),
    [investment, setInvestment] = useState(12),
    [question, setQuestion] = useState(''),
    [messages, setMessages] = useState<Message[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [settings, setSettings] = useState(false),
    [endpoint, setEndpoint] = useState(() => {
      try {
        return localStorage.getItem('lumen-ai-endpoint') || '';
      } catch {
        return '';
      }
    }),
    [draftEndpoint, setDraftEndpoint] = useState(endpoint),
    [token, setToken] = useState(''),
    [draftToken, setDraftToken] = useState(''),
    [mode, setMode] = useState<'demo' | 'claude'>('demo'),
    [settingError, setSettingError] = useState(''),
    [saved, setSaved] = useState(false);
  const controller = useRef<AbortController | null>(null),
    chatEnd = useRef<HTMLDivElement>(null),
    inputRef = useRef<HTMLTextAreaElement>(null);
  const rows = useMemo(() => selectRows('retail', { ...defaultFilters, region }), [region]),
    m = useMemo(() => metrics('retail', rows), [rows]),
    trend = useMemo(() => series(rows), [rows]);
  const last = trend[trend.length - 1].actual;
  const baseline = last * 1.05,
    predicted = baseline * (1 + demand / 100) * (1 + price / 100),
    profit = predicted * (m.margin / 100) - investment;
  const historical = trend.map((d, i) => ({
    name: d.name,
    actual: d.actual,
    forecast: i === trend.length - 1 ? d.actual : undefined,
    low: undefined as number | undefined,
    high: undefined as number | undefined,
    baseline: undefined as number | undefined,
  }));
  const forecast = [
    ...historical,
    {
      name: '11月',
      actual: undefined,
      forecast: last + (predicted - last) * 0.55,
      baseline: last + (baseline - last) * 0.55,
      low: (last + (predicted - last) * 0.55) * 0.94,
      high: (last + (predicted - last) * 0.55) * 1.06,
    },
    {
      name: '12月',
      actual: undefined,
      forecast: predicted,
      baseline,
      low: predicted * 0.91,
      high: predicted * 1.09,
    },
  ];
  const categories = groups(rows, 'category', 'retail');
  const context = {
    dataset: 'LUMEN synthetic retail, Jan–Oct 2026',
    filters: { region, period: '2026年1–10月' },
    metrics: {
      revenueMillionYen: Math.round(m.actual),
      growthPercent: Number(m.growth.toFixed(1)),
      marginPercent: Number(m.margin.toFixed(1)),
    },
    categories: categories.map((g) => ({
      name: g.name,
      revenueMillionYen: Number(g.actual.toFixed(1)),
      growthPercent: Number(g.growth.toFixed(1)),
    })),
    monthly: trend,
    scenario: {
      demandPercent: demand,
      pricePercent: price,
      marketingMillionYen: investment,
      baselineDecemberMillionYen: Number(baseline.toFixed(1)),
      scenarioDecemberMillionYen: Number(predicted.toFixed(1)),
      scenarioProfitMillionYen: Number(profit.toFixed(1)),
      method:
        'Illustrative formula: baseline = October revenue × 1.05; scenario = baseline × (1 + demand%) × (1 + price%); profit = scenario × historical gross margin − marketing. Not a statistical forecast.',
    },
  };
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (messages.length) chatEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, busy]);
  const closeSettings = useCallback(() => setSettings(false), []);
  function demoAnswer(q: string) {
    const leader = categories[0],
      weak = categories.reduce((a, b) => (a.growth < b.growth ? a : b));
    const scope = region === 'すべて' ? '全エリア' : region;
    if (/リスク|注意|懸念/.test(q))
      return `${scope}で注目するリスクは、成長率の差とシナリオの前提です。\n\n${weak.name}の前年同期比は +${format(weak.growth, 1)}%。カテゴリー間の差は、売上の規模だけでは読み取れません。地域と期間を分けて確認しましょう。\n\nシナリオ売上は ${format(predicted, 1)}百万円ですが、需要 ${demand}%・単価 ${price}%の変化を仮定した計算値です。価格弾力性や競合の反応は含めていません。需要が想定どおり伸びない場合も比較してください。`;
    if (/シナリオ|予測|需要|単価|販促|12月|利益/.test(q))
      return `現在のシナリオでは、12月の売上は ${format(predicted, 1)}百万円です。ベースライン ${format(baseline, 1)}百万円に対して +${format((predicted / baseline - 1) * 100, 1)}%となります。\n\n前提：需要 ${demand > 0 ? '+' : ''}${demand}%、単価 ${price > 0 ? '+' : ''}${price}%、販促投資 ${investment}百万円。過去の粗利益率 ${format(m.margin, 1)}%を当てはめると、販促費控除後の粗利益は ${format(profit, 1)}百万円です。\n\nこれは計算式によるWhat-ifの例です。グラフの帯は説明用の±9%範囲で、統計的な信頼区間ではありません。左のスライダーで別の仮説を試せます。`;
    if (/何を|施策|アクション|次|改善/.test(q))
      return `${scope}では、次の3つを比較することを提案します。\n\n1. ${leader.name}：売上 ${format(leader.actual, 1)}百万円、構成比 ${format((leader.actual / m.actual) * 100, 1)}%。まず在庫・販売機会の不足を確認します。\n2. ${weak.name}：成長率 +${format(weak.growth, 1)}%。リテール画面でエリアを絞り、弱い拠点があるか確かめます。\n3. 販促前にシナリオ比較：需要増加だけでなく、販促費 ${investment}百万円を引いた利益も確認します。\n\nこれらはサンプルデータに基づく検討の入口です。効果の因果関係は確認できません。`;
    if (/売上|要約|状況|分析|伸び|成長|好調|なぜ/.test(q))
      return `${scope}の売上は ${format(m.actual / 100, 2)}億円、前年同期比 +${format(m.growth, 1)}%です。粗利益率は ${format(m.margin, 1)}%。\n\n最大のカテゴリーは${leader.name}で、売上 ${format(leader.actual, 1)}百万円、全体の ${format((leader.actual / m.actual) * 100, 1)}%を占めています。最も成長率が低い${weak.name}（+${format(weak.growth, 1)}%）と比較すると、規模と成長を分けて見る必要があります。\n\n「なぜ」を断定する情報はありません。リテール画面で地域別・月別に絞ると、追加調査する場所を探せます。`;
    return `「${q}」について、このデモが扱えるのは売上の要約・リスク・次の施策・現在のシナリオです。\n\nまず${scope}の総売上は ${format(m.actual / 100, 2)}億円、前年同期比 +${format(m.growth, 1)}%。現在のシナリオでは12月 ${format(predicted, 1)}百万円です。\n\n自由な質問の分析には、接続設定からClaude APIを有効にしてください。今の回答は表示中のデータを使ったルールベース生成です。`;
  }
  async function ask(text: string) {
    if (busy || !text.trim()) return;
    const q = text.trim().slice(0, 1000);
    setQuestion('');
    setError('');
    setMessages((v) => [...v, { role: 'user', text: q }]);
    setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 45000);
    try {
      if (mode === 'demo') {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(resolve, 650);
          abort.signal.addEventListener(
            'abort',
            () => {
              clearTimeout(t);
              reject(new DOMException('Aborted', 'AbortError'));
            },
            { once: true },
          );
        });
        setMessages((v) => [
          ...v,
          { role: 'assistant', text: demoAnswer(q), source: 'demo', evidence: true },
        ]);
      } else {
        if (!endpoint) throw new Error('接続先URLを設定してください。');
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ message: q, context }),
          signal: abort.signal,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || `接続エラー (${response.status})`);
        if (typeof result?.answer !== 'string')
          throw new Error('サーバーの応答形式が正しくありません。');
        setMessages((v) => [
          ...v,
          { role: 'assistant', text: result.answer, source: 'claude', evidence: true },
        ]);
      }
    } catch (e) {
      setError(
        e instanceof Error && e.name === 'AbortError'
          ? 'リクエストを中止しました。時間切れの場合は再試行してください。'
          : e instanceof Error
            ? e.message
            : '接続に失敗しました。',
      );
    } finally {
      clearTimeout(timer);
      setBusy(false);
      controller.current = null;
    }
  }
  function applySettings() {
    try {
      if (draftEndpoint) {
        const url = new URL(draftEndpoint, location.href);
        if (!['http:', 'https:'].includes(url.protocol))
          throw new Error('http / https のURLを指定してください。');
        if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
          throw new Error('外部の接続先にはhttpsを使用してください。');
        if (url.username || url.password) throw new Error('URLに認証情報を含めないでください。');
        setEndpoint(url.href);
        localStorage.setItem('lumen-ai-endpoint', url.href);
        setMode('claude');
      } else {
        setEndpoint('');
        setMode('demo');
        localStorage.removeItem('lumen-ai-endpoint');
      }
      setToken(draftToken);
      setSettingError('');
      setSettings(false);
    } catch (e) {
      setSettingError(e instanceof Error ? e.message : '保存できませんでした');
    }
  }
  return (
    <div className="ai-dashboard page-enter">
      <header className="page-heading">
        <div>
          <span className="eyebrow">
            <span className="tiny-line" /> INTELLIGENCE, REIMAGINED{' '}
            <span className="eyebrow-index">/ 05</span>
          </span>
          <h1>
            Lumen Copilot
            <span className="ai-heading-spark">
              <Sparkles size={29} strokeWidth={1.4} />
            </span>
          </h1>
          <p>問いから、仮説へ。データとともに考える、新しい意思決定。</p>
        </div>
        <button
          className="button subtle"
          onClick={() => {
            setDraftEndpoint(endpoint);
            setDraftToken(token);
            setSettings(true);
          }}
        >
          <Settings2 size={16} />
          接続設定
        </button>
      </header>
      <div className="ai-welcome">
        <span className="ai-welcome-icon">
          <Sparkles size={25} />
        </span>
        <div>
          <span className="eyebrow">YOUR DECISION COMPANION</span>
          <h2>データは語る。次の一手を、一緒に。</h2>
          <p>サンプルデータを読み解き、シナリオを試す。分析の先にあるアクションへ。</p>
        </div>
        <div className="ai-mode">
          <span className={mode === 'demo' ? 'demo-dot' : 'live-dot'} />
          {mode === 'demo' ? 'DEMO MODE' : 'CLAUDE API'}
          <small>{mode === 'demo' ? 'ルールベース · APIキー不要' : 'サーバー経由で接続'}</small>
        </div>
      </div>
      <div className="ai-filter-row">
        <label>
          分析コンテキスト{' '}
          <select
            aria-label="AI分析エリア"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            {['すべて', '関東', '関西', '中部', '九州'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <ChevronDown size={12} />
        </label>
        <span>
          <ShieldCheck size={13} />
          合成データのみ · 2026年1–10月
        </span>
        <a href="#/retail">
          元のダッシュボードへ
          <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="kpi-grid ai-kpis">
        <Kpi
          label="売上 / 実績"
          value={format(m.actual / 100, 2)}
          unit="億円"
          change={`+${format(m.growth, 1)}%`}
          spark={trend.map((x) => x.actual)}
        />
        <Kpi
          label="12月 / シナリオ売上"
          value={format(predicted, 1)}
          unit="百万円"
          change={`+${format((predicted / baseline - 1) * 100, 1)}%`}
          positive={predicted >= baseline}
          caption="ベースライン比"
          spark={[last, last + (predicted - last) * 0.55, predicted]}
        />
        <Kpi
          label="販促控除後 / 想定粗利益"
          value={format(profit, 1)}
          unit="百万円"
          change={`投資 ${investment}百万円`}
          positive={profit > 0}
          caption="シナリオの計算結果"
        />
      </div>
      <div className="ai-workspace">
        <div className="ai-analysis-column">
          <Panel
            title="未来を、試してみる。"
            subtitle="売上実績とWhat-ifシナリオ / 百万円"
            action={
              <span className="ai-pill">
                <WandSparkles size={12} /> SCENARIO LAB
              </span>
            }
          >
            <div className="forecast-legend">
              <span>
                <i />
                実績
              </span>
              <span>
                <i />
                シナリオ
              </span>
              <span>
                <i />
                ベースライン
              </span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={forecast} margin={{ top: 15, left: 0, right: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ai-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#a9b5ff" stopOpacity={0.2} />
                    <stop offset="1" stopColor="#a9b5ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--grid)" strokeDasharray="3 4" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 10 }}
                />
                <YAxis
                  width={45}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 10 }}
                  domain={['auto', 'auto']}
                  tickFormatter={(n) => format(n)}
                />
                <Tooltip content={<Tip />} />
                <ReferenceLine
                  x="10月"
                  stroke="#66798c"
                  strokeDasharray="3 5"
                  label={{
                    value: 'TODAY',
                    position: 'insideTopLeft',
                    fill: '#8292a6',
                    fontSize: 8,
                  }}
                />
                <Area
                  dataKey="actual"
                  type="monotone"
                  name="売上実績"
                  stroke="#85c9bd"
                  strokeWidth={2.5}
                  fill="url(#ai-fill)"
                />
                <Area
                  dataKey="high"
                  type="monotone"
                  name="説明用上限"
                  stroke="none"
                  fill="#9c9ff0"
                  fillOpacity={0.1}
                />
                <Area
                  dataKey="low"
                  type="monotone"
                  name="説明用下限"
                  stroke="none"
                  fill="var(--panel)"
                />
                <Line
                  dataKey="baseline"
                  type="monotone"
                  name="ベースライン"
                  stroke="#6f8092"
                  strokeDasharray="3 5"
                  dot={false}
                />
                <Line
                  dataKey="forecast"
                  type="monotone"
                  name="シナリオ"
                  stroke="#b0a1ef"
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="forecast-note">
              <CircleHelp size={12} />
              計算式によるシナリオです。帯は説明用の範囲で、統計的な信頼区間ではありません。
            </div>
            <div className="scenario-sliders">
              {[
                {
                  label: '需要の変化',
                  value: demand,
                  set: setDemand,
                  min: -15,
                  max: 25,
                  unit: '%',
                },
                { label: '単価の変化', value: price, set: setPrice, min: -10, max: 15, unit: '%' },
                {
                  label: '販促投資',
                  value: investment,
                  set: setInvestment,
                  min: 0,
                  max: 40,
                  unit: '百万円',
                },
              ].map((s) => (
                <label key={s.label}>
                  <span>
                    {s.label}
                    <b>
                      {s.value > 0 && s.unit === '%' ? '+' : ''}
                      {s.value}
                      <small>{s.unit}</small>
                    </b>
                  </span>
                  <input
                    type="range"
                    aria-label={s.label}
                    value={s.value}
                    min={s.min}
                    max={s.max}
                    onChange={(e) => {
                      s.set(Number(e.target.value));
                      setSaved(false);
                    }}
                  />
                  <span className="range-extents">
                    <small>
                      {s.min}
                      {s.unit}
                    </small>
                    <small>
                      {s.max}
                      {s.unit}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <div className="scenario-actions">
              <button
                className="text-button"
                onClick={() => {
                  setDemand(8);
                  setPrice(2);
                  setInvestment(12);
                  setSaved(false);
                }}
              >
                前提をリセット
              </button>
              <button
                className="button subtle"
                onClick={() => {
                  download(
                    'lumen-scenario.json',
                    JSON.stringify(context, null, 2),
                    'application/json',
                  );
                  setSaved(true);
                }}
              >
                {saved ? <Check size={14} /> : <ArrowDownToLine size={14} />}シナリオを保存
              </button>
            </div>
          </Panel>
          <Panel title="Signals worth a closer look" subtitle="ルールベースで抽出した、分析の入口">
            <div className="signal-cards">
              <div>
                <span className="signal-icon green">
                  <ArrowUpRight size={18} />
                </span>
                <div>
                  <span className="eyebrow">GROWTH SIGNAL</span>
                  <h4>{categories[0].name}が売上を牽引</h4>
                  <p>
                    構成比 {format((categories[0].actual / m.actual) * 100, 1)}
                    %。大きい市場での小さな改善が、全体を動かします。
                  </p>
                </div>
                <a href="#/retail" aria-label="売上分析を開く">
                  <ArrowUpRight size={16} />
                </a>
              </div>
              <div>
                <span className="signal-icon amber">
                  <Lightbulb size={18} />
                </span>
                <div>
                  <span className="eyebrow">WHAT-IF OPPORTUNITY</span>
                  <h4>需要と投資のバランスを検討</h4>
                  <p>
                    需要 {demand}%、販促 {investment}
                    百万円。売上の伸びと利益を同時に見て、仮説を磨きます。
                  </p>
                </div>
                <button
                  aria-label="シナリオをCopilotに質問"
                  onClick={() => void ask('現在のシナリオを分析してください')}
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </Panel>
        </div>
        <section className="copilot-panel">
          <header>
            <div className="copilot-avatar">
              <Sparkles size={19} />
            </div>
            <div>
              <h3>Ask Lumen</h3>
              <span>{mode === 'demo' ? 'Interactive demo' : 'Connected to Claude'}</span>
            </div>
            <span className="copilot-status">
              <i />
              {mode === 'demo' ? 'DEMO' : 'API'}
            </span>
          </header>
          <div className="chat-messages" aria-live="polite" aria-busy={busy}>
            {messages.length === 0 ? (
              <div className="chat-intro">
                <span className="intro-orb">
                  <Sparkles size={27} strokeWidth={1} />
                </span>
                <h3>
                  いい問いが、
                  <br />
                  次の景色をひらく。
                </h3>
                <p>
                  表示中の売上データとシナリオをもとに、
                  <br />
                  一緒に考えてみましょう。
                </p>
                <div className="suggested-questions">
                  {[
                    '売上の状況を要約して',
                    '次に何をすべき？',
                    '現在のシナリオを分析して',
                    '注意すべきリスクは？',
                  ].map((q) => (
                    <button key={q} onClick={() => void ask(q)}>
                      {q}
                      <ArrowUpRight size={13} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <article className={`message message-${msg.role}`} key={i}>
                  {msg.role === 'assistant' && (
                    <span className="message-avatar">
                      <Sparkles size={13} />
                    </span>
                  )}
                  <div>
                    <span className="message-role">
                      {msg.role === 'user'
                        ? 'YOU'
                        : msg.source === 'demo'
                          ? 'LUMEN · DEMO'
                          : 'LUMEN · CLAUDE'}
                    </span>
                    <p>{msg.text}</p>
                    {msg.evidence && (
                      <div className="evidence-chip">
                        <ShieldCheck size={11} />
                        表示中のデータ + シナリオ<small>{region}</small>
                      </div>
                    )}
                  </div>
                </article>
              ))
            )}
            {busy && (
              <div className="thinking">
                <LoaderCircle size={15} className="spin" />
                {mode === 'demo' ? '表示中のデータを整理しています…' : 'Claudeが分析しています…'}
              </div>
            )}
            {error && (
              <div role="alert" className="chat-error">
                {error}
                <button onClick={() => setError('')} aria-label="エラーを閉じる">
                  <X size={12} />
                </button>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          {messages.length > 0 && (
            <div className="chat-tools">
              <button
                onClick={() => {
                  setMessages([]);
                  setError('');
                }}
                disabled={busy}
              >
                会話をクリア
              </button>
              <span>各質問は現在のデータで分析します</span>
            </div>
          )}
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
          >
            <label className="sr-only" htmlFor="copilot-question">
              データについて質問
            </label>
            <textarea
              ref={inputRef}
              id="copilot-question"
              value={question}
              maxLength={1000}
              rows={2}
              placeholder="データについて、聞いてみる…"
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void ask(question);
                }
              }}
            />
            <div>
              <span>
                <Sparkles size={11} />
                {mode === 'demo' ? 'DEMO · ルールベース' : 'CLAUDE · API'}
              </span>
              {busy ? (
                <button
                  type="button"
                  onClick={() => controller.current?.abort()}
                  aria-label="生成を停止"
                >
                  <Square size={14} />
                </button>
              ) : (
                <button type="submit" disabled={!question.trim()} aria-label="質問を送信">
                  <Send size={16} />
                </button>
              )}
            </div>
          </form>
          <p className="chat-disclaimer">
            {mode === 'demo'
              ? 'APIには接続していません。ルールに沿ったデモ回答です。'
              : 'AIの回答には誤りが含まれることがあります。'}
            <br />
            業務判断の前に、元のデータと前提をご確認ください。
          </p>
        </section>
      </div>
      {settings && (
        <Modal title="Claude API 接続設定" onClose={closeSettings}>
          <div className="prose">
            <p>
              初期状態はキー不要のデモです。実際のClaudeを使う場合は、同梱のAPIサーバーを配置し、そのURLを設定してください。
            </p>
            <div className="connection-diagram">
              <span>このサイト</span>
              <ArrowRight size={18} />
              <span>
                APIサーバー<small>キーはサーバー環境変数</small>
              </span>
              <ArrowRight size={18} />
              <span>Claude</span>
            </div>
            <label className="form-label">
              API エンドポイント
              <input
                placeholder="https://your-api.example.com/api/chat"
                type="url"
                value={draftEndpoint}
                onChange={(e) => setDraftEndpoint(e.target.value)}
              />
            </label>
            <label className="form-label">
              接続用トークン（API_ACCESS_TOKEN）
              <input
                type="password"
                autoComplete="off"
                value={draftToken}
                onChange={(e) => setDraftToken(e.target.value)}
                placeholder="サーバーに設定したアクセス用トークン"
              />
            </label>
            <p className="form-hint">
              ClaudeのAPIキーは入力しないでください。接続トークンはこの画面を開いている間だけメモリに保持します。URLだけがこのブラウザに保存されます。
            </p>
            <p>
              サーバー側に ANTHROPIC_API_KEY・CLAUDE_MODEL・API_ACCESS_TOKEN・ALLOWED_ORIGIN
              を設定します。GitHub Pagesはフロントエンドを配信し、AIサーバーは別途実行します。
            </p>
            {settingError && (
              <p className="form-error" role="alert">
                {settingError}
              </p>
            )}
            <div className="modal-actions">
              <button
                className="button subtle"
                onClick={() => {
                  setMode('demo');
                  setSettings(false);
                }}
              >
                デモを使う
              </button>
              <button className="button primary" onClick={applySettings}>
                接続設定を保存
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
