import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { blogApi } from "../services/api";
import "./RichTextEditor.css";

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
};

export default function RichTextEditor({ value, onChange, disabled = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  const insertImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      try {
        const { url } = await blogApi.uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        // upload failed; silently ignore
      }
    };
    input.click();
  };

  return (
    <div className="rich-text-editor" data-testid="rich-text-editor">
      {!disabled && editor && (
        <div className="rich-text-editor__toolbar">
          <button
            type="button"
            className={`rich-text-editor__btn${editor.isActive("bold") ? " is-active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn${editor.isActive("italic") ? " is-active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`rich-text-editor__btn${editor.isActive("heading", { level: 2 }) ? " is-active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            className="rich-text-editor__btn"
            onMouseDown={(e) => { e.preventDefault(); insertImage(); }}
            title="Insert image"
          >
            IMG
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="rich-text-editor__content" />
    </div>
  );
}
