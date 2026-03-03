import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RichTextRenderer from "./RichTextRenderer";

describe("RichTextRenderer", () => {
  it("renders the HTML content", () => {
    const { container } = render(<RichTextRenderer html="<p>Hello world</p>" />);
    expect(container.querySelector("p")).toHaveTextContent("Hello world");
  });

  it("applies blog-content CSS class", () => {
    const { container } = render(<RichTextRenderer html="<p>text</p>" />);
    expect(container.firstChild).toHaveClass("blog-content");
  });

  it("does not show raw HTML tags as text", () => {
    render(<RichTextRenderer html="<p>My post</p>" />);
    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument();
  });

  it("renders bold text", () => {
    const { container } = render(
      <RichTextRenderer html="<p><strong>Bold</strong> word</p>" />
    );
    expect(container.querySelector("strong")).toHaveTextContent("Bold");
  });
});
