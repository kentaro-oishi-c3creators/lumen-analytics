import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Modal } from './components/UI';
import slideData from './slides.json';
export const slides = slideData;
const exportFormats = [
  {
    name: 'HTML',
    href: './lumen-design-story.html',
    extension: '.html',
    label: 'HTMLで保存',
    description: '1ファイルでオフライン再生',
  },
  {
    name: 'PowerPoint',
    href: './lumen-design-story.pptx',
    extension: '.pptx',
    label: 'PowerPointで保存',
    description: '文字・図解を編集できる10枚',
  },
  {
    name: 'PDF',
    href: './lumen-design-story.pdf',
    extension: '.pdf',
    label: 'PDFで保存',
    description: '閲覧・共有に使える10枚',
  },
  {
    name: 'SVG',
    href: './lumen-svg-slides.zip',
    extension: '.zip',
    label: 'SVGで保存',
    description: 'ベクター原稿をまとめて取得',
  },
];
function ExportLinks() {
  return (
    <div className="export-format-grid">
      {exportFormats.map((format) => (
        <a
          key={format.name}
          className="export-format-link"
          href={format.href}
          download
          aria-label={format.label}
        >
          <div>
            <span>{format.name}</span>
            <small>{format.extension}</small>
            <ArrowDownToLine size={16} />
          </div>
          <p>{format.description}</p>
        </a>
      ))}
    </div>
  );
}
export default function Story() {
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [fullscreen, setFullscreen] = useState(false),
    [exporting, setExporting] = useState(false);
  const closeExport = useCallback(() => setExporting(false), []);
  const ref = useRef<HTMLDivElement>(null),
    thumbRef = useRef<HTMLDivElement>(null);
  const go = (delta: number) =>
    setIndex((i) => Math.max(0, Math.min(slides.length - 1, i + delta)));
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches('input,textarea,select') ||
        document.querySelector('[role="dialog"]')
      )
        return;
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
          <button
            className="button subtle"
            onClick={() => {
              setPlaying(false);
              setExporting(true);
            }}
          >
            <ArrowDownToLine size={14} />
            書き出す
          </button>
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
      <section className="story-exports" aria-label="スライドの書き出し">
        <div className="story-exports-heading">
          <div>
            <span className="eyebrow">TAKE THE STORY WITH YOU</span>
            <h2>全10枚を、使いやすい形式で。</h2>
          </div>
          <span>HTML / PPTX / PDF / SVG</span>
        </div>
        <ExportLinks />
        <p className="export-hint">
          HTMLは画像・フォントを内包し、単体で再生できます。PowerPointは文字と図解を編集でき、ダッシュボード画面は画像として配置しています。
        </p>
      </section>
      <div className="story-notes">
        <p>{slide.note}</p>
        <a href={slide.href}>
          この体験を開く
          <ArrowUpRight size={13} />
        </a>
      </div>
      {exporting && (
        <Modal title="スライドを書き出す" onClose={closeExport}>
          <div className="export-dialog-content">
            <p>紹介スライド全10枚を、用途に合わせて保存できます。</p>
            <ExportLinks />
            <p className="export-hint">
              HTMLは単体でオフライン再生できます。PowerPointは文字・図解を編集できます。ダッシュボード画面は画像です。
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
