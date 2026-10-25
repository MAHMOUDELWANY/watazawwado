// One slide on the 1600 × 900 canvas, for screenshots and recordings (see scripts/curriculum/README.md).
// ?subject=zad-adults&lesson=1&p=<page>&s=<step>   &demo steps forward every &gap= ms; &end shows the end screen (&ar);
// &opening plays the series opening (Kids and Teens lesson 1); &player opens the whole lesson in the real teacher player.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/index.css';
import { Slide } from '../../../src/curriculum/slides/Slide';
import { LessonEnd } from '../../../src/curriculum/slides/motion/LessonEnd';
import { Opening } from '../../../src/curriculum/slides/Opening';
import { findLesson } from '../../../src/curriculum/catalog';
import { LessonPlayer } from '../../../src/curriculum/LessonPlayer';

const q = new URLSearchParams(location.search);
const lesson = findLesson(q.get('subject') || 'zad-adults', Number(q.get('lesson') || 1))!;
const p = Number(q.get('p') || 0);
const page = lesson.pages[p];
const total = page.lines.length + (page.items?.length || 0) + (page.evidence ? 1 : 0) + (page.interaction ? 1 : 0);

function App() {
  const [step, setStep] = React.useState(Number(q.get('s') || 0));
  React.useEffect(() => {
    if (!q.has('demo')) return;
    const t = setInterval(() => setStep((s) => Math.min(total, s + 1)), Number(q.get('gap') || 3500));
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ width: 1600, height: 900, position: 'relative', overflow: 'hidden' }}>
      {q.has('opening') && lesson.opening
        ? <Opening lesson={lesson} data={lesson.opening} onDone={() => {}} />
        : q.has('end')
        ? <LessonEnd lesson={lesson} ar={q.has('ar')} teacher onRestart={() => {}} onClose={() => {}} />
        : <Slide lesson={lesson} pageIndex={p} step={step} onCorrect={() => {}} onGameResult={() => {}} />}
    </div>
  );
}
createRoot(document.getElementById('root')!).render(q.has('player') ? <div style={{ maxWidth: 1400, margin: '0 auto' }}><LessonPlayer lesson={lesson} lang="en" teacher /></div> : <App />);
