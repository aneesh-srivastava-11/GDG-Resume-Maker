'use client';

import { useEffect, useRef, useState } from 'react';
import { ResumeForm } from '@/components/ResumeForm';
import { ResumePreview } from '@/components/ResumePreview';
import { initialData, type ResumeData } from '@/lib/initialData';

export default function Home() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);
  const [template, setTemplate] = useState<'harvard'>('harvard');

  // Resizable split state
  const [leftPercent, setLeftPercent] = useState<number>(50);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const viewportWidth = window.innerWidth;
      const x = Math.max(200, Math.min(e.clientX, viewportWidth - 200)); // min 200px each side
      const pct = (x / viewportWidth) * 100;
      setLeftPercent(Math.max(20, Math.min(pct, 80)));
    };
    const onUp = () => { isDraggingRef.current = false; document.body.classList.remove('select-none'); };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const onDown = () => {
    isDraggingRef.current = true;
    document.body.classList.add('select-none');
  };


  // Scaling state
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState<number | 'auto'>('auto');
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const availableWidth = entry.contentRect.width;
        // 8.27in is approx 794px. We add some padding (e.g. 32px or 2rem) for margin.
        const contentWidth = 840;
        const newScale = Math.min(1, availableWidth / contentWidth);
        setScale(newScale);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [leftPercent]); // Re-check when divider moves

  // Measure content height to adjust wrapper
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Adjust container height to match scaled content + margin
        // contentRect.height is the unscaled height
        setContainerHeight(entry.contentRect.height * scale);
      }
    });

    observer.observe(content);
    return () => observer.disconnect();
  }, [scale, resumeData]); // Re-measure if scale or data changes

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Left: Editor */}
      <div
        className="p-4 overflow-y-auto min-w-0 no-print bg-white isolate scrollbar-thin"
        style={{ flexBasis: `${leftPercent}%` }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Resume Editor</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="template" className="text-sm text-gray-700">Template</label>
            <select
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value as 'harvard')}
              className="text-sm border rounded px-2 py-1 bg-white"
            >
              <option value="harvard">Harvard</option>
            </select>
          </div>
        </div>
        <ResumeForm data={resumeData} setData={setResumeData} />
      </div>

      {/* Draggable Divider */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor and preview"
        className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize no-print relative z-20"
        onMouseDown={onDown}
      />

      {/* Right: Preview */}
      <div
        ref={containerRef}
        className="bg-white p-4 overflow-y-auto overflow-x-hidden min-w-0 print-area isolate border-l border-gray-200 scrollbar-thin"
        style={{ flexBasis: `${100 - leftPercent}%` }}
      >
        <div className="flex justify-end mb-2 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-sm rounded bg-black text-white hover:bg-gray-800"
            aria-label="Print resume as PDF"
          >
            Print PDF
          </button>
        </div>

        {/* Scaled Wrapper */}
        <div
          style={{
            height: typeof containerHeight === 'number' ? `${containerHeight + 40}px` : 'auto', // +40 for top margin
            transition: 'height 0.2s ease-out'
          }}
        >
          <div
            ref={contentRef}
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: '8.27in',
              margin: '0 auto',
            }}
          >
            <ResumePreview data={resumeData} template={template} />
          </div>
        </div>
      </div>
    </main>
  );
}
