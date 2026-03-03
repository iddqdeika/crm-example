import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../services/api", () => ({
  blogApi: {
    get: vi.fn().mockResolvedValue({
      id: "post-1",
      title: "Existing Title",
      body: "<p>Existing body</p>",
      author_display: "Jane",
      creator_display_name: "Jane",
      creator_id: "user-1",
      created_at: "2026-03-01T12:00:00Z",
      updated_at: "2026-03-01T12:00:00Z",
      is_edited: false,
    }),
    create: vi.fn().mockResolvedValue({ id: "new-post" }),
    update: vi.fn().mockResolvedValue({ id: "post-1" }),
  },
}));

vi.mock("@tiptap/react", () => ({
  useEditor: () => null,
  EditorContent: () => null,
}));
vi.mock("@tiptap/starter-kit", () => ({ default: {} }));
vi.mock("@tiptap/extension-image", () => ({ default: { configure: () => ({}) } }));
vi.mock("@tiptap/extension-link", () => ({ default: { configure: () => ({}) } }));

import BlogManageEditPage from "./BlogManageEditPage";

describe("BlogManageEditPage — new post", () => {
  it("renders title input", () => {
    render(
      <MemoryRouter initialEntries={["/blog/manage/new"]}>
        <Routes>
          <Route path="/blog/manage/new" element={<BlogManageEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/^title\s+/i)).toBeInTheDocument();
  });

  it("renders author input", () => {
    render(
      <MemoryRouter initialEntries={["/blog/manage/new"]}>
        <Routes>
          <Route path="/blog/manage/new" element={<BlogManageEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
  });

  it("renders Save draft and Publish buttons", () => {
    render(
      <MemoryRouter initialEntries={["/blog/manage/new"]}>
        <Routes>
          <Route path="/blog/manage/new" element={<BlogManageEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("save-draft-btn")).toBeInTheDocument();
    expect(screen.getByTestId("publish-post-btn")).toBeInTheDocument();
  });

  it("renders Preview button", () => {
    render(
      <MemoryRouter initialEntries={["/blog/manage/new"]}>
        <Routes>
          <Route path="/blog/manage/new" element={<BlogManageEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId("preview-btn")).toBeInTheDocument();
  });

  it("auto-fills slug from title when user types title", async () => {
    const u = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/blog/manage/new"]}>
        <Routes>
          <Route path="/blog/manage/new" element={<BlogManageEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    const titleInput = screen.getByLabelText(/^title\s+/i);
    await u.type(titleInput, "My First Post");
    const slugInput = screen.getByLabelText(/url slug|slug/i);
    expect(slugInput).toHaveValue("my-first-post");
  });

  it("stops overwriting slug when user edits slug manually", async () => {
    const u = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/blog/manage/new"]}>
        <Routes>
          <Route path="/blog/manage/new" element={<BlogManageEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    const titleInput = screen.getByLabelText(/^title\s+/i);
    await u.type(titleInput, "My Post");
    const slugInput = screen.getByLabelText(/url slug|slug/i);
    await u.clear(slugInput);
    await u.type(slugInput, "custom-slug");
    await u.type(titleInput, " Updated");
    expect(slugInput).toHaveValue("custom-slug");
  });

  it("clears slug when title is cleared and slug was not manually edited", async () => {
    const u = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/blog/manage/new"]}>
        <Routes>
          <Route path="/blog/manage/new" element={<BlogManageEditPage />} />
        </Routes>
      </MemoryRouter>
    );
    const titleInput = screen.getByLabelText(/^title\s+/i);
    await u.type(titleInput, "Post");
    const slugInput = screen.getByLabelText(/url slug|slug/i);
    expect(slugInput).toHaveValue("post");
    await u.clear(titleInput);
    expect(slugInput).toHaveValue("");
  });
});
