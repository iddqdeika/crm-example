import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdGroupsSection from "./AdGroupsSection";

const noop = vi.fn();

function renderEmpty() {
  return render(
    <AdGroupsSection
      adGroups={[]}
      expanded={[]}
      onToggle={noop}
      onAddAdGroup={noop}
      onRemoveAdGroup={noop}
      onUpdateAdGroup={noop}
      onAddCreative={noop}
      onRemoveCreative={noop}
      onUpdateCreative={noop}
    />
  );
}

describe("AdGroupsSection", () => {
  it("renders the Ad groups heading", () => {
    renderEmpty();
    expect(screen.getByText("Ad groups")).toBeInTheDocument();
  });

  it("renders the Add ad group button when not readOnly", () => {
    renderEmpty();
    expect(screen.getByTestId("add-ad-group")).toBeInTheDocument();
  });

  it("does not render Add ad group button when readOnly", () => {
    const { container } = render(
      <AdGroupsSection
        adGroups={[]}
        expanded={[]}
        readOnly={true}
        onToggle={noop}
        onAddAdGroup={noop}
        onRemoveAdGroup={noop}
        onUpdateAdGroup={noop}
        onAddCreative={noop}
        onRemoveCreative={noop}
        onUpdateCreative={noop}
      />
    );
    expect(container.querySelector("[data-testid='add-ad-group']")).not.toBeInTheDocument();
  });
});
