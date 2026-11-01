import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Factory,
  Fullscreen,
  Gem,
  HeartPulse,
  LayoutGrid,
  Menu,
  MoonStar,
  Play,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import { configs, industryIds, type Route } from './data';
import Dashboard from './Dashboard';
import AiDashboard from './AiDashboard';
import Story from './Story';
import { Modal } from './components/UI';
const icons = { retail: ShoppingBag, manufacturing: Factory, healthcare: HeartPulse, finance: Gem };
function currentRoute(): Route {
  const path = location.hash.replace('#/', '').split('?')[0];
  return ['collection', 'story', 'ai', ...industryIds].includes(path)
    ? (path as Route)
    : 'collection';
}
export default function App() {
  const [route, setRoute] = useState<Route>(currentRoute),
    [menu, setMenu] = useState(false),
    [help, setHelp] = useState(false);
  useEffect(() => {
    const fn = () => {
      setRoute(currentRoute());
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  useEffect(() => {
    document.title = `${route === 'collection' ? 'The collection' : route === 'story' ? 'Designing decisions' : route === 'ai' ? 'Lumen Copilot' : configs[route].en} — LUMEN`;
  }, [route]);
  const dark = route === 'manufacturing' || route === 'finance' || route === 'ai';
  return (
    <div className={`app ${dark ? 'dark' : ''} theme-${route}`}>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main');
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        コンテンツへ移動
      </a>
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <a className="brand" href="#/collection" aria-label="LUMEN コレクション">
          <span className="brand-icon">
            L<i />
          </span>
          <span>
            LUMEN<small>ANALYTICS ATELIER</small>
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          aria-label="メニューを閉じる"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <div className="workspace">
          <span className="workspace-avatar">LA</span>
          <div>
            Demo workspace<small>ダッシュボード・コレクション</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <nav aria-label="メインナビゲーション">
          <span className="nav-label">EXPLORE</span>
          <a href="#/collection" className={route === 'collection' ? 'active' : ''}>
            <LayoutGrid size={18} />
            コレクション<span className="nav-count">05</span>
          </a>
          <a href="#/story" className={route === 'story' ? 'active' : ''}>
            <Play size={18} />
            デザインストーリー
            <ChevronRight size={14} className="nav-end" />
          </a>
          <span className="nav-label spaced">DASHBOARDS</span>
          {industryIds.map((id) => {
            const Icon = icons[id];
            return (
              <a key={id} href={`#/${id}`} className={route === id ? 'active' : ''}>
                <Icon size={18} />
                <span>
                  {
                    {
                      retail: 'リテール / 売上分析',
                      manufacturing: '製造 / 生産・品質',
                      healthcare: '医療 / 病院経営',
                      finance: '金融 / 資産運用',
                    }[id]
                  }
                </span>
                <small className="nav-end">{configs[id].index}</small>
              </a>
            );
          })}
          <a href="#/ai" className={`ai-nav ${route === 'ai' ? 'active' : ''}`}>
            <Sparkles size={18} />
            <span>Lumen Copilot</span>
            <span className="new-tag">AI</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-story">
            <MoonStar size={21} />
            <p>Data, with a point of view.</p>
            <a href="#/story">
              デザインの背景を見る <ArrowRight size={14} />
            </a>
          </div>
          <button className="help-link" onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            このデモについて
            <ArrowRight size={14} />
          </button>
          <div className="sidebar-footer">
            <span className="avatar">L</span>
            <div>
              Lumen Studio<small>Concept collection · 2026</small>
            </div>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="メニューを閉じる"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu icon-button"
              onClick={() => setMenu(true)}
              aria-label="メニューを開く"
            >
              <Menu size={20} />
            </button>
            <a href="#/collection">Workspace</a>
            <ChevronRight size={13} />
            <span>
              {route === 'collection'
                ? 'The collection'
                : route === 'story'
                  ? 'Design story'
                  : route === 'ai'
                    ? 'Lumen Copilot'
                    : configs[route].en}
            </span>
          </div>
          <div className="top-actions">
            <span className="sample-badge">
              <i />
              SAMPLE DATA
            </span>
            <button
              className="icon-button fullscreen-button"
              title="全画面表示"
              aria-label="全画面表示"
              onClick={() => {
                if (document.fullscreenElement) void document.exitFullscreen();
                else void document.documentElement.requestFullscreen?.().catch(() => {});
              }}
            >
              <Fullscreen size={17} />
            </button>
            <span className="top-avatar">LA</span>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {route === 'collection' ? (
            <Collection />
          ) : route === 'story' ? (
            <Story />
          ) : route === 'ai' ? (
            <AiDashboard />
          ) : (
            <Dashboard key={route} id={route} />
          )}
        </main>
        <footer className="main-footer">
          <span>
            <Activity size={12} /> LUMEN ANALYTICS ATELIER
          </span>
          <span>
            架空データを使ったインタラクティブデモ <span className="footer-dot">·</span> 2026.10
            snapshot
          </span>
          <a href="#/story">
            Made for better decisions <ArrowRight size={12} />
          </a>
        </footer>
      </div>
      {help && (
        <Modal title="このコレクションについて" onClose={() => setHelp(false)}>
          <div className="prose">
            <p>
              LUMENは、Tableauのビジュアル分析体験に着想を得た、React製の独立したデザイン・プロトタイプです。Tableau製品の埋め込み・Workbookではありません。
            </p>
            <p>
              4つの業務ダッシュボードとAIコックピットを体験できます。すべての企業・施設・数値は架空です。医療や投資の判断には使用しないでください。
            </p>
            <h3>操作のヒント</h3>
            <p>
              期間・拠点・カテゴリーで絞り込み → グラフをポイントして数値を確認 →
              棒グラフや構成比をクリックして連動 →
              明細行から詳細を見る。条件の保存やCSV出力にも対応しています。
            </p>
            <h3>AIについて</h3>
            <p>
              初期状態はローカルのルールベースデモです。Claude
              APIへの通信は行いません。接続設定で、ご自身のサーバーのURLを設定するとClaudeモードに切り替えられます。
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Collection() {
  return (
    <div className="collection page-enter">
      <section className="collection-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <i className="tiny-line" /> THE ANALYTICS COLLECTION / VOL. 01
          </span>
          <h1>
            データを、
            <br />
            意思のある<span>景色</span>へ。
          </h1>
          <p>
            ビジネスの複雑さを、美しい視界に変える。
            <br />
            4つの業界と、AIがひらくもうひとつの未来。
          </p>
          <div className="hero-buttons">
            <a className="button primary" href="#/retail">
              ダッシュボードを体験 <ArrowRight size={17} />
            </a>
            <a className="text-button" href="#/story">
              <Play size={15} />
              ストーリーを見る
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>
                04<span> + AI</span>
              </strong>
              <small>業務に合わせた分析体験</small>
            </div>
            <div>
              <strong>
                100<span>%</span>
              </strong>
              <small>操作できるプロトタイプ</small>
            </div>
            <div>
              <strong>SVG</strong>
              <small>美しく、スケールする表現</small>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-label="データの流れを表すビジュアル">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="hero-orb">
            <svg viewBox="0 0 380 380" aria-hidden="true">
              <defs>
                <linearGradient id="orb" x2="1" y2="1">
                  <stop stopColor="#d6ebc8" />
                  <stop offset="1" stopColor="#467a6c" />
                </linearGradient>
                <radialGradient id="orbshade" cx=".28" cy=".25" r=".8">
                  <stop stopColor="#e6f5d4" />
                  <stop offset=".5" stopColor="#a8c5a4" />
                  <stop offset="1" stopColor="#2c665b" />
                </radialGradient>
                <filter id="orbnoise">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency=".8"
                    numOctaves="3"
                    stitchTiles="stitch"
                  />
                  <feColorMatrix type="saturate" values="0" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope=".15" />
                  </feComponentTransfer>
                  <feBlend in="SourceGraphic" mode="soft-light" />
                </filter>
              </defs>
              <circle cx="190" cy="190" r="160" fill="url(#orbshade)" filter="url(#orbnoise)" />
              {Array.from({ length: 14 }, (_, i) => (
                <ellipse
                  key={i}
                  cx="190"
                  cy="190"
                  rx={35 + i * 9}
                  ry="158"
                  fill="none"
                  stroke="#ebf3d3"
                  strokeWidth=".5"
                  opacity=".35"
                  transform={`rotate(${i * 12} 190 190)`}
                />
              ))}
            </svg>
          </div>
          <div className="floating-note note-top">
            <span className="live-dot" /> Discover the signal<strong>複雑さの中に、道筋を。</strong>
          </div>
          <div className="floating-note note-bottom">
            <span className="mini-bars">
              {[22, 35, 29, 48, 42, 61, 73].map((h, i) => (
                <i key={i} style={{ height: h * 0.5 }} />
              ))}
            </span>
            <div>
              Clarity, by design.<small>データから、確かな一歩へ。</small>
            </div>
            <ArrowUpGlyph />
          </div>
          <span className="art-coordinate coord-one">35°40′ N / 139°45′ E</span>
          <span className="art-coordinate coord-two">A NEW PERSPECTIVE ON DATA</span>
        </div>
      </section>
      <section className="collection-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIVE PERSPECTIVES. ONE VISION.</span>
            <h2>答えの形は、ビジネスの数だけ。</h2>
          </div>
          <span className="section-meta">
            01 — 05 <span> / </span> INTERACTIVE DEMOS
          </span>
        </div>
        <div className="collection-grid">
          {industryIds.map((id) => {
            const c = configs[id],
              Icon = icons[id];
            return (
              <a href={`#/${id}`} className={`collection-card card-${id}`} key={id}>
                <div className="card-preview">
                  <img
                    src={`./captures/${id}.png`}
                    alt={`${c.en} の実際のダッシュボード画面`}
                    loading="lazy"
                  />
                  <span className="preview-open">
                    <ArrowRight size={20} />
                  </span>
                  <span className="card-number">{c.index}</span>
                </div>
                <div className="card-copy">
                  <span className="eyebrow">
                    <Icon size={13} />
                    {c.eyebrow}
                  </span>
                  <h3>
                    {c.en}
                    <ArrowRight size={19} />
                  </h3>
                  <p>{c.description}</p>
                  <span className="capability">{c.capability}</span>
                </div>
              </a>
            );
          })}
          <a href="#/ai" className="collection-card ai-collection-card">
            <div className="ai-card-art">
              <span className="eyebrow">THE NEXT CHAPTER</span>
              <div className="ai-symbol">
                <Sparkles size={54} strokeWidth={1} />
              </div>
              <span className="ai-orbit" />
              <span className="ai-orbit second" />
              <div className="ai-card-question">「次に、何をすべき？」</div>
              <span className="ai-card-answer">データと対話する、新しい意思決定。</span>
            </div>
            <div className="card-copy">
              <span className="eyebrow">
                <Sparkles size={13} /> AI-POWERED INTELLIGENCE
              </span>
              <h3>
                Lumen Copilot
                <ArrowRight size={19} />
              </h3>
              <p>自然言語で問い、仮説を試し、次のアクションへ。</p>
              <span className="capability">Claude API ready · デモから体験</span>
            </div>
          </a>
          <a href="#/story" className="story-collection-card">
            <BookOpen size={26} strokeWidth={1.3} />
            <span className="eyebrow">BEHIND THE EXPERIENCE</span>
            <h3>
              美しさには、
              <br />
              理由がある。
            </h3>
            <p>
              実際の画面と図解でひも解く、
              <br />
              LUMENのデザインストーリー。
            </p>
            <span className="text-button">
              プレゼンテーションを見る
              <ArrowRight size={16} />
            </span>
          </a>
        </div>
      </section>
      <section className="collection-bottom">
        <span className="eyebrow">BUILT TO EXPLORE</span>
        <h2>
          見るだけから、
          <br />
          <span>使ってわかる</span>ダッシュボードへ。
        </h2>
        <div>
          {[
            ['01', '絞る', 'フィルターで、見たい景色へ。'],
            ['02', '探る', '数値と背景を、行き来する。'],
            ['03', '考える', 'AIと一緒に、仮説を広げる。'],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function ArrowUpGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18 18 5M5 5h13v13" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
export { icons };
