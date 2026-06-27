import { useEffect, useRef } from "react";

interface Props {
  value: string;
  editing: boolean;
  className?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}

/**
 * A contentEditable wrapper that stays uncontrolled while focused (so the
 * caret never jumps) but mirrors external value changes when blurred.
 */
export default function EditableText({
  value,
  editing,
  className,
  placeholder,
  onChange,
  onCommit,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (editing && el) {
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  return (
    <div
      ref={ref}
      className={className}
      contentEditable={editing}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onFocus={onCommit}
      onInput={(e) => onChange((e.target as HTMLDivElement).textContent ?? "")}
      onPointerDown={(e) => {
        if (editing) e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") (e.target as HTMLDivElement).blur();
        e.stopPropagation();
      }}
    />
  );
}
