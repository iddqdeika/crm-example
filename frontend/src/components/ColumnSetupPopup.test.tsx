/** US5 T048: Column setup popup — reorder, at least one column, save restores order. */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ColumnSetupPopup, { type ColumnDef } from "./ColumnSetupPopup";

const ALL_COLS: ColumnDef[] = [
  { id: "name", label: "Name" },
  { id: "budget", label: "Budget" },
  { id: "status", label: "Status" },
];

describe("ColumnSetupPopup", () => {
  it("renders selected columns with reorder buttons", () => {
    render(
      <ColumnSetupPopup
        allColumns={ALL_COLS}
        activeColumnIds={["name", "budget"]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const items = screen.getAllByTestId("column-item");
    expect(items).toHaveLength(2);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
  });

  it("move down reorders columns", async () => {
    const onSave = vi.fn();
    render(
      <ColumnSetupPopup
        allColumns={ALL_COLS}
        activeColumnIds={["name", "budget"]}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /move name down/i }));
    await userEvent.click(screen.getByTestId("column-setup-save"));
    expect(onSave).toHaveBeenCalledWith(["budget", "name"]);
  });

  it("cannot uncheck last remaining column", async () => {
    render(
      <ColumnSetupPopup
        allColumns={ALL_COLS}
        activeColumnIds={["name"]}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const checkbox = screen.getByRole("checkbox", { checked: true });
    expect(checkbox).toBeDisabled();
  });

  it("save callback receives current column order", async () => {
    const onSave = vi.fn();
    render(
      <ColumnSetupPopup
        allColumns={ALL_COLS}
        activeColumnIds={["name", "budget", "status"]}
        onSave={onSave}
        onClose={vi.fn()}
      />
    );
    await userEvent.click(screen.getByTestId("column-setup-save"));
    expect(onSave).toHaveBeenCalledWith(["name", "budget", "status"]);
  });
});
