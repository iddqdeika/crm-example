import "./RichTextRenderer.css";

type Props = {
  html: string;
};

export default function RichTextRenderer({ html }: Props) {
  return (
    <div
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
