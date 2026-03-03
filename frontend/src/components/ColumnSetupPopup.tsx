import "./ColumnSetupPopup.css";
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
    <div className="column-setup-popup__overlay" data-testid="column-setup-popup" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="column-setup-popup__modal" role="dialog" aria-label="Column setup">
        <h3 className="column-setup-popup__heading">Column setup</h3>
        <ul className="column-setup-popup__list" data-testid="column-list">
          {selected.map((colId, idx) => (
            <li key={colId} className="column-setup-popup__item" data-testid="column-item">
              <label className="column-setup-popup__item-label">
                <input
                  type="checkbox"
                  className="column-setup-popup__checkbox"
                  checked
                  onChange={() => toggle(colId)}
                  disabled={selected.length <= 1}
                />
                {label(colId)}
              </label>
              <button type="button" className="column-setup-popup__order-btn" onClick={() => moveUp(idx)} disabled={idx === 0} aria-label={`Move ${label(colId)} up`}>↑</button>
              <button type="button" className="column-setup-popup__order-btn" onClick={() => moveDown(idx)} disabled={idx === selected.length - 1} aria-label={`Move ${label(colId)} down`}>↓</button>
            </li>
          ))}
        </ul>
        <h4 className="column-setup-popup__subheading">Available columns</h4>
        <ul className="column-setup-popup__list">
          {allColumns
            .filter((c) => !selected.includes(c.id))
            .map((c) => (
              <li key={c.id} className="column-setup-popup__item">
                <label className="column-setup-popup__item-label">
                  <input type="checkbox" className="column-setup-popup__checkbox" checked={false} onChange={() => toggle(c.id)} />
                  {c.label}
                </label>
              </li>
            ))}
        </ul>
        <div className="column-setup-popup__actions">
          <button type="button" className="column-setup-popup__save-btn" onClick={() => onSave(selected)} data-testid="column-setup-save">Save</button>
          <button type="button" className="column-setup-popup__cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
