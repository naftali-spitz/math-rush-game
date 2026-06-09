import { useEffect, useRef } from 'react';
import type { Question } from '../types/game';

const clean = (value: string) => {
  let next = value.replace(/[^0-9-]/g, '');
  const negative = next.startsWith('-');
  next = next.replace(/-/g, '');
  return `${negative ? '-' : ''}${next}`;
};

export function QuestionCard(props: { question: Question; value: string; feedback: 'idle' | 'correct' | 'wrong'; correctAnswer: number | null; disabled: boolean; onChange: (v: string) => void; onSubmit: () => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => { if (!props.disabled) ref.current?.focus(); }, [props.disabled, props.question.id]);
  return <section className={`question-card ${props.feedback}`}>
    <div className="skill-line">{props.question.skill.toUpperCase()} · DIFFICULTY {props.question.difficulty}</div>
    <div className="question-text">{props.question.text}</div>
    <form onSubmit={(e) => { e.preventDefault(); props.onSubmit(); }}>
      <input ref={ref} autoFocus disabled={props.disabled} value={props.value} inputMode="numeric" placeholder="Type answer + Enter" onChange={(e) => props.onChange(clean(e.target.value))} />
    </form>
    <div className="feedback">{props.feedback === 'correct' ? 'Correct!' : props.feedback === 'wrong' ? `Wrong — Correct answer: ${props.correctAnswer}` : ''}</div>
  </section>;
}
