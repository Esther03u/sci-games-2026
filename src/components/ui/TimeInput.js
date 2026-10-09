'use client';
import { useRef, useState } from 'react';
import { formatTyping, parseTime, toFieldValue } from '@/lib/time-input';

const INVALID = 'เวลาแบบ 24 ชั่วโมง เช่น 09:30 หรือ 19:00';

/**
 * 24-hour time typed as text ("1900" → 19:00), instead of <input type="time">,
 * whose 12-hour AM/PM picker the browser chooses. onChange gets the same
 * event shape as a native input: { target: { value: 'HH:MM' | '' } }.
 */
export default function TimeInput({
  value,
  onChange,
  required = false,
  id,
  className = 'form-input',
  ...rest
}) {
  const [text, setText] = useState(toFieldValue(value));
  const [shown, setShown] = useState(value);
  const ref = useRef(null);

  // A different match / row was loaded into the form: show its time, unless
  // the text already means the same time (e.g. "930" while typing 09:30).
  if (value !== shown) {
    setShown(value);
    const v = toFieldValue(value);
    if (parseTime(text) !== (v || null)) setText(v);
  }

  const emit = (v) => onChange?.({ target: { value: v } });

  const validate = (t) => {
    const ok = t === '' ? !required : parseTime(t) !== null;
    ref.current?.setCustomValidity(ok ? '' : INVALID);
    return ok;
  };

  return (
    <input
      {...rest}
      ref={ref}
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={5}
      placeholder="เช่น 19:00"
      title={INVALID}
      className={className}
      required={required}
      value={text}
      aria-invalid={text !== '' && parseTime(text) === null ? true : undefined}
      onChange={(e) => {
        const t = formatTyping(e.target.value);
        setText(t);
        validate(t);
        const parsed = parseTime(t);
        if (parsed) emit(parsed);
        else if (t === '') emit('');
      }}
      onBlur={() => {
        const parsed = parseTime(text);
        if (parsed && parsed !== text) setText(parsed);
        validate(parsed || text);
      }}
    />
  );
}
