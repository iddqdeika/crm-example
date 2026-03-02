import { useEffect, useState } from "react";

export type ColumnDef = {
  id: string;
  label: string;
};

type Props = {
  allColumns: ColumnDef[];
  activeColumnIds: string[];
  onSave: (columnIds: string[]) => void;
  onClose: () => void;
};

export default function ColumnSetupPopup({ allColumns, activeColumnIds, onSave, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected([...activeColumnIds]);
  }, [activeColumnIds]);

  const toggle = (colId: string) => {
    setSelected((prev) => {
      if (prev.includes(colId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== colId);
      }
      return [...prev, colId];
    });
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setSelected((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const label = (colId: string) => allColumns.find((c) => c.id === colId)?.label ?? colId;

  return (
    <div className="column-setup-popup" data-testid="column-setup-popup" role="dialog" aria-label="Column setup">
      <h3>Column setup</h3>
      <ul data-testid="column-list">
        {selected.map((colId, idx) => (
          <li key={colId} data-testid="column-item">
            <label>
              <input
                type="checkbox"
                checked
                onChange={() => toggle(colId)}
                disabled={selected.length <= 1}
              />
              {label(colId)}
            </label>
            <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} aria-label={`Move ${label(colId)} up`}>Up</button>
            <button type="button" onClick={() => moveDown(idx)} disabled={idx === selected.length - 1} aria-label={`Move ${label(colId)} down`}>Down</button>
          </li>
        ))}
      </ul>
      <h4>Available columns</h4>
      <ul>
        {allColumns
          .filter((c) => !selected.includes(c.id))
          .map((c) => (
            <li key={c.id}>
              <label>
                <input type="checkbox" checked={false} onChange={() => toggle(c.id)} />
                {c.label}
              </label>
            </li>
          ))}
      </ul>
      <div className="column-setup-popup__actions">
        <button type="button" onClick={() => onSave(selected)} data-testid="column-setup-save">Save</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
