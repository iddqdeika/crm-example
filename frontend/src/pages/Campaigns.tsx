import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { campaignApi, columnConfigApi, type CampaignSummary } from "../services/api";
import ColumnSetupPopup, { type ColumnDef } from "../components/ColumnSetupPopup";

const ALL_COLUMNS: ColumnDef[] = [
  { id: "name", label: "Name" },
  { id: "budget", label: "Budget" },
  { id: "status", label: "Status" },
  { id: "owner", label: "Owner" },
  { id: "created_at", label: "Created" },
  { id: "updated_at", label: "Updated" },
];

function cellValue(c: CampaignSummary, colId: string): string {
  switch (colId) {
    case "name": return c.name;
    case "budget": return String(c.budget);
    case "status": return c.status;
    case "owner": return c.owner_display_name ?? String(c.owner_id);
    case "created_at": return new Date(c.created_at).toLocaleDateString();
    case "updated_at": return new Date(c.updated_at).toLocaleDateString();
    default: return "";
  }
}

const SORTABLE_FIELDS = new Set(["name", "budget", "status", "created_at", "updated_at"]);

export default function Campaigns() {
  const [items, setItems] = useState<CampaignSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [columnIds, setColumnIds] = useState<string[]>(ALL_COLUMNS.map((c) => c.id));
  const [showColumnSetup, setShowColumnSetup] = useState(false);

  useEffect(() => {
    columnConfigApi.get("campaigns").then((cfg) => {
      if (cfg.column_ids.length) setColumnIds(cfg.column_ids);
    }).catch(() => {});
  }, []);

  const loadCampaigns = useCallback(() => {
    setLoading(true);
    campaignApi
      .list({ search: search || undefined, sort })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [search, sort]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleSort = (colId: string) => {
    if (!SORTABLE_FIELDS.has(colId)) return;
    setSort((prev) => {
      if (prev === colId) return `-${colId}`;
      if (prev === `-${colId}`) return undefined;
      return colId;
    });
  };

  const handleColumnSave = (newCols: string[]) => {
    setColumnIds(newCols);
    setShowColumnSetup(false);
    columnConfigApi.save("campaigns", newCols).catch(() => {});
  };

  const handleArchive = async (c: CampaignSummary) => {
    if (!window.confirm(`Archive campaign "${c.name}"? Archived campaigns become view-only.`)) return;
    try {
      await campaignApi.update(c.id, { status: "archive", version: c.version });
      loadCampaigns();
    } catch {
      // silently reload on error so user sees current state
      loadCampaigns();
    }
  };

  const sortIndicator = (colId: string) => {
    if (sort === colId) return " ▲";
    if (sort === `-${colId}`) return " ▼";
    return "";
  };

  return (
    <main className="page">
      <h1>Campaigns</h1>
      <div className="campaigns__toolbar">
        <Link to="/campaigns/new">Create campaign</Link>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns…"
          aria-label="Search campaigns"
          data-testid="campaign-search"
        />
        <button type="button" onClick={() => setShowColumnSetup(true)} data-testid="column-setup-btn">Columns</button>
      </div>
      {showColumnSetup && (
        <ColumnSetupPopup
          allColumns={ALL_COLUMNS}
          activeColumnIds={columnIds}
          onSave={handleColumnSave}
          onClose={() => setShowColumnSetup(false)}
        />
      )}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table data-testid="campaign-table">
          <thead>
            <tr>
              {columnIds.map((colId) => {
                const def = ALL_COLUMNS.find((c) => c.id === colId);
                return (
                  <th
                    key={colId}
                    onClick={() => handleSort(colId)}
                    style={{ cursor: SORTABLE_FIELDS.has(colId) ? "pointer" : "default" }}
                    data-testid={`col-header-${colId}`}
                  >
                    {def?.label ?? colId}{sortIndicator(colId)}
                  </th>
                );
              })}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                {columnIds.map((colId) => (
                  <td key={colId}>{cellValue(c, colId)}</td>
                ))}
                <td>
                  <Link to={`/campaigns/${c.id}`}>Edit</Link>
                  {c.status !== "archive" && (
                    <button
                      type="button"
                      className="campaigns__archive-btn"
                      data-testid={`archive-${c.id}`}
                      onClick={() => handleArchive(c)}
                    >
                      Archive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && total > 0 && <p>Total: {total}</p>}
    </main>
  );
}
