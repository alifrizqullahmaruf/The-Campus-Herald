"use client";

import Image from "@tiptap/extension-image";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cx } from "@/lib/cx";

/**
 * Article body editor. Deliberately small (spec, stage 01: authors are not
 * technical): headings, bold, italic, lists, pull quotes and images only.
 */
export function RichTextEditor({
  initialHtml,
  editable,
  onChange,
  labelledBy,
  invalid,
}: {
  initialHtml: string;
  editable: boolean;
  onChange: (html: string, isEmpty: boolean) => void;
  labelledBy: string;
  invalid?: boolean;
}) {
  const editor = useEditor({
    // Required with server rendering: render once the browser has mounted.
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        link: false,
      }),
      Image.configure({ allowBase64: false }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "prose-herald min-h-80 max-w-none px-5 py-4 outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelledBy,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.isEmpty),
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  return (
    <div
      className={cx(
        "overflow-hidden rounded-card border-3 bg-surface",
        invalid ? "border-cat-opinion" : "border-ink",
        !editable && "bg-paper",
      )}
    >
      {editor && editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();
  const buttons: Array<{ label: string; icon: LucideIcon; active?: boolean; disabled?: boolean; run: () => void }> = [
    { label: "Heading", icon: Heading2, active: state.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
    { label: "Subheading", icon: Heading3, active: state.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    { label: "Bold", icon: Bold, active: state.bold, run: () => chain().toggleBold().run() },
    { label: "Italic", icon: Italic, active: state.italic, run: () => chain().toggleItalic().run() },
    { label: "Bullet list", icon: List, active: state.bullet, run: () => chain().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrdered, active: state.ordered, run: () => chain().toggleOrderedList().run() },
    { label: "Pull quote", icon: Quote, active: state.quote, run: () => chain().toggleBlockquote().run() },
    { label: "Undo", icon: Undo2, disabled: !state.canUndo, run: () => chain().undo().run() },
    { label: "Redo", icon: Redo2, disabled: !state.canRedo, run: () => chain().redo().run() },
  ];

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-1 border-b-3 border-ink bg-paper p-2">
      {buttons.map(({ label, icon, active, disabled, run }) => (
        <ToolButton key={label} label={label} icon={icon} active={active} disabled={disabled} onClick={run} />
      ))}
      <ToolButton label="Insert image" icon={ImagePlus} onClick={() => fileRef.current?.click()} />
      {/* Preview: the image is shown from a local URL. Uploading arrives with storage in Phase 4. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) editor.chain().focus().setImage({ src: URL.createObjectURL(file), alt: "" }).run();
          event.target.value = "";
        }}
      />
    </div>
  );
}

function ToolButton({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "grid size-9 place-items-center rounded-md border-2 disabled:opacity-40",
        active ? "border-ink bg-cat-events" : "border-transparent hover:border-ink hover:bg-surface",
      )}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={2.5} />
    </button>
  );
}
