import { useEffect, useRef } from "react";
import { fileToDataUrl } from "./utils";
import { IconImage } from "./icons";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onCommit: () => void;
}

/**
 * A lightweight rich-text editor (contentEditable + execCommand) supporting
 * bold, font size, text color and inline images. Stores HTML.
 */
export default function RichText({ value, onChange, onCommit }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const onInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      ref.current?.focus();
      document.execCommand("insertImage", false, url);
      if (ref.current) onChange(ref.current.innerHTML);
    } catch {
      /* ignore */
    }
    e.target.value = "";
  };

  // keep toolbar clicks from stealing the selection
  const keep = (e: React.PointerEvent) => e.preventDefault();

  return (
    <div className="rich">
      <div className="rich-toolbar">
        <button title="Bold" onPointerDown={keep} onClick={() => exec("bold")}>
          <b>B</b>
        </button>
        <select
          title="Text size"
          className="rich-size"
          defaultValue="3"
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => exec("fontSize", e.target.value)}
        >
          <option value="2">S</option>
          <option value="3">M</option>
          <option value="5">L</option>
          <option value="7">XL</option>
        </select>
        <label className="rich-color" title="Text color" onPointerDown={keep}>
          <input type="color" defaultValue="#1b1d1a" onChange={(e) => exec("foreColor", e.target.value)} />
        </label>
        <button title="Insert image" onPointerDown={keep} onClick={() => fileInput.current?.click()}>
          <IconImage />
        </button>
        <input ref={fileInput} type="file" accept="image/*" style={{ display: "none" }} onChange={onInsertImage} />
      </div>
      <div
        ref={ref}
        className="rich-body"
        contentEditable
        suppressContentEditableWarning
        onFocus={onCommit}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}
