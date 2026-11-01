import { useState, useEffect, useRef } from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Expand,
  Minimize,
  Pause,
  Play,
} from 'lucide-react';
export const slides = [
  {
    file: '01-opening',
    title: 'データを、意思のある景色へ。',
    note: '4業種の分析画面とAIコックピットを、実際の操作画面と図解で紹介します。',
    href: '#/collection',
  },
  {
    file: '02-overview',
    title: '4つの現場。4つの問い。',
    note: '同じチャートを並べるのではなく、業務で最初に答えたい問いから画面を設計しました。',
    href: '#/collection',
  },
  {
    file: '03-retail',
    title: 'Retail — 成長の理由を、探る。',
    note: '期間・エリア・カテゴリーの3軸でKPIと全図表が連動。グラフからの絞り込みや明細ドリルダウンで、仮説を確かめられます。',
    href: '#/retail',
  },
  {
    file: '04-manufacturing',
    title: 'Manufacturing — 止めないために、見える化する。',
    note: 'OEEを時間・性能・品質に分解し、生産計画との乖離やライン別の課題を読み解きます。',
    href: '#/manufacturing',
  },
  {
    file: '05-healthcare',
    title: 'Healthcare — ケアの時間を、つくる。',
    note: '患者フロー・来院数・待ち時間・診療科の負荷を俯瞰。経路配分は説明用モデルです。',
    href: '#/healthcare',
  },
  {
    file: '06-finance',
    title: 'Finance — リスクを捉え、次の機会へ。',
    note: '月末残高・配分・市場・リスクを横断。リスクは保有資産の加重平均で、相関を考慮したポートフォリオリスクではありません。',
    href: '#/finance',
  },
  {
    file: '07-interaction',
    title: '触れるほど、見えてくる。',
    note: 'ブラウザでフィルター、マーク選択、詳細表示を実際に操作して撮影した画面です。条件は全グラフ・明細・CSVに反映されます。',
    href: '#/retail',
  },
  {
    file: '08-ai',
    title: 'AIと、仮説のその先へ。',
    note: '需要・単価・販促費のスライダーを動かして、売上と利益を同時に比較。質問には表示中のコンテキストを渡します。初期状態はルールベースデモです。',
    href: '#/ai',
  },
  {
    file: '09-architecture',
    title: '美しい体験を、開かれた構成で。',
    note: 'フロントエンドはGitHub Pages。Claudeは別のNode.jsサーバーから接続。APIキーはブラウザに配信せず、サーバー環境変数で管理します。',
    href: '#/ai',
  },
  {
    file: '10-closing',
    title: '次の意思決定を、ここから。',
    note: 'すべて架空データのデザイン・プロトタイプです。TableauのWorkbookやTableau本体の埋め込みではありません。各画面へ移動して、実際に触れてみてください。',
    href: '#/collection',
  },
];
export default function Story() {
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [fullscreen, setFullscreen] = useState(false);
  const ref = useRef<HTMLDivElement>(null),
    thumbRef = useRef<HTMLDivElement>(null);
  const go = (delta: number) =>
    setIndex((i) => Math.max(0, Math.min(slides.length - 1, i + delta)));
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,textarea,select')) return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        go(1);
      }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setIndex(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        setIndex(slides.length - 1);
      }
    };
    window.addEventListener('keydown', handler);
    const fs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', fs);
    return () => {
      window.removeEventListener('keydown', handler);
      document.removeEventListener('fullscreenchange', fs);
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setIndex((i) => {
          if (i === slides.length - 1) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        }),
      11000,
    );
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    thumbRef.current
      ?.querySelector<HTMLElement>('.selected')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [index]);
  const slide = slides[index];
  const hotspots =
    index === 1
      ? ['retail', 'manufacturing', 'healthcare', 'finance'].map((id, i) => ({
          href: `#/${id}`,
          label: `${id}のダッシュボードを開く`,
          left: (84 + i * 362) / 16,
          top: 302 / 9,
          width: 344 / 16,
          height: 446 / 9,
        }))
      : index === 9
        ? ['retail', 'manufacturing', 'healthcare', 'finance', 'ai'].map((id, i) => ({
            href: `#/${id}`,
            label: `${id}のダッシュボードを開く`,
            left: (87 + i * 290) / 16,
            top: 592 / 9,
            width: 255 / 16,
            height: 150 / 9,
          }))
        : index === 6
          ? [
              '#/retail',
              '#/retail?period=quarter&region=関東&category=アパレル',
              '#/retail?period=quarter&region=関東&category=アパレル&detail=アパレル',
            ].map((href, i) => ({
              href,
              label: `操作ステップ${i + 1}を体験する`,
              left: (84 + i * 490) / 16,
              top: 312 / 9,
              width: 457 / 16,
              height: 425 / 9,
            }))
          : [];
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void ref.current?.requestFullscreen?.().catch(() => {});
  };
  return (
    <div className="story-page page-enter">
      <header className="page-heading">
        <div>
          <span className="eyebrow">
            <span className="tiny-line" /> THE DESIGN STORY / 10 SLIDES
          </span>
          <h1>
            Designing decisions<span className="heading-dot">.</span>
          </h1>
          <p>5つの体験を、実際の画面と図解でめぐる。</p>
        </div>
        <div className="heading-actions">
          <a className="button subtle" href={`./slides/${slide.file}.svg`} download>
            <ArrowDownToLine size={14} />
            SVGを保存
          </a>
          <button className="button primary" onClick={toggleFullscreen}>
            <Expand size={14} />
            プレゼンテーション
          </button>
        </div>
      </header>
      <div
        className="story-stage"
        ref={ref}
        aria-roledescription="スライドショー"
        aria-label={`${index + 1}/${slides.length} ${slide.title}`}
      >
        <img
          key={slide.file}
          src={`./slides/${slide.file}.svg`}
          alt={slide.title}
          className="slide-img"
        />
        {hotspots.map((h, i) => (
          <a
            key={i}
            className="slide-card-hotspot"
            href={h.href}
            aria-label={h.label}
            style={{
              left: `${h.left}%`,
              top: `${h.top}%`,
              width: `${h.width}%`,
              height: `${h.height}%`,
            }}
            onClick={() => {
              if (fullscreen) void document.exitFullscreen();
            }}
          >
            <span>
              体験する
              <ArrowUpRight size={12} />
            </span>
          </a>
        ))}
        <a
          className="slide-quicklink"
          href={slide.href}
          onClick={() => {
            if (fullscreen) void document.exitFullscreen();
          }}
        >
          実際に操作する
          <ArrowUpRight size={10} />
        </a>
        <a
          href={slide.href}
          className="slide-hotspot"
          aria-label="このスライドのダッシュボードを開く"
          onClick={() => {
            if (fullscreen) void document.exitFullscreen();
          }}
        >
          ダッシュボードへ
          <ArrowRight size={13} />
        </a>
        <div className="fullscreen-nav">
          <button onClick={() => go(-1)} disabled={index === 0} aria-label="前のスライド">
            <ArrowLeft size={17} />
          </button>
          <span>
            {index + 1} / {slides.length}
          </span>
          <button
            onClick={() => go(1)}
            disabled={index === slides.length - 1}
            aria-label="次のスライド"
          >
            <ArrowRight size={17} />
          </button>
          <button onClick={toggleFullscreen} aria-label="全画面を終了">
            <Minimize size={17} />
          </button>
        </div>
      </div>
      <div className="story-controls">
        <div className="slide-caption" aria-live="polite">
          <strong>
            {String(index + 1).padStart(2, '0')}
            <small> / 10</small>
          </strong>
          <span>{slide.title}</span>
        </div>
        <div className="story-buttons">
          <span>← → キーで移動</span>
          <button onClick={() => go(-1)} disabled={index === 0} aria-label="前のスライド">
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? '自動再生を停止' : '自動再生'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => go(1)}
            disabled={index === slides.length - 1}
            aria-label="次のスライド"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      <div className="slide-progress">
        <i style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
      </div>
      <div className="slide-thumbnails" ref={thumbRef} aria-label="スライド一覧">
        {slides.map((s, i) => (
          <button
            key={s.file}
            className={i === index ? 'selected' : ''}
            onClick={() => {
              setIndex(i);
              setPlaying(false);
            }}
            aria-label={`${i + 1}: ${s.title}`}
            aria-current={i === index ? 'step' : undefined}
          >
            <img src={`./slides/${s.file}.svg`} alt="" loading="lazy" />
            <span>
              <small>{String(i + 1).padStart(2, '0')}</small>
              {s.title}
            </span>
          </button>
        ))}
      </div>
      <div className="story-downloads">
        <a className="text-button" href="./lumen-design-story.pdf" download>
          <ArrowDownToLine size={13} />
          全10枚をPDFで保存
        </a>
        <a className="text-button" href="./lumen-svg-slides.zip" download>
          <ArrowDownToLine size={13} />
          SVGデッキをまとめて保存
        </a>
      </div>
      <div className="story-notes">
        <p>{slide.note}</p>
        <a href={slide.href}>
          この体験を開く
          <ArrowUpRight size={13} />
        </a>
      </div>
    </div>
  );
}
