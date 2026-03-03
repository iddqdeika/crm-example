import "./CampaignEditPage.css";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { campaignApi, type AdGroupDto, type CreativeDto, type CampaignDetail } from "../services/api";
import AdGroupsSection, {
  type AdGroupEdit,
  type CreativeEdit,
  emptyAdGroup,
} from "../components/AdGroupsSection";

function crToEdit(cr: CreativeDto): CreativeEdit {
  return {
    id: cr.id,
    name: cr.name,
    ad_type: cr.ad_type,
    click_url: cr.click_url ?? "",
    sort_order: cr.sort_order,
  };
}

function toEdit(ag: AdGroupDto): AdGroupEdit {
  return {
    id: ag.id,
    country_targets: ag.country_targets ?? "",
    platform_targets: ag.platform_targets ?? "",
    browser_targets: ag.browser_targets ?? "",
    timezone_targets: ag.timezone_targets ?? "",
    ssp_id_whitelist: ag.ssp_id_whitelist ?? "",
    ssp_id_blacklist: ag.ssp_id_blacklist ?? "",
    source_id_whitelist: ag.source_id_whitelist ?? "",
    source_id_blacklist: ag.source_id_blacklist ?? "",
    sort_order: ag.sort_order,
    creatives: (ag.creatives ?? []).map(crToEdit),
  };
}

export default function CampaignEditPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [adGroups, setAdGroups] = useState<AdGroupEdit[]>([]);
  const [expanded, setExpanded] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  const loadCampaign = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setConflictMessage(null);
    campaignApi
      .get(id)
      .then((c) => {
        setCampaign(c);
        setName(c.name);
        setBudget(String(c.budget));
        setStatus(c.status);
        const groups = (c.ad_groups ?? []).map(toEdit);
        setAdGroups(groups);
        setExpanded(groups.map(() => false));
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const updateAdGroup = (index: number, updates: Partial<AdGroupEdit>) => {
    setAdGroups((prev) =>
      prev.map((ag, i) => (i === index ? { ...ag, ...updates } : ag))
    );
  };

  const addAdGroup = () => {
    setAdGroups((prev) => [...prev, emptyAdGroup(prev.length)]);
    setExpanded((prev) => [...prev, true]);
  };

  const removeAdGroup = (index: number) => {
    setAdGroups((prev) => prev.filter((_, i) => i !== index));
    setExpanded((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCreative = (agIdx: number, crIdx: number, updates: Partial<CreativeEdit>) => {
    setAdGroups((prev) =>
      prev.map((ag, i) =>
        i === agIdx
          ? {
              ...ag,
              creatives: ag.creatives.map((cr, j) =>
                j === crIdx ? { ...cr, ...updates } : cr
              ),
            }
          : ag
      )
    );
  };

  const addCreative = (agIdx: number) => {
    setAdGroups((prev) =>
      prev.map((ag, i) =>
        i === agIdx
          ? { ...ag, creatives: [...ag.creatives, { name: "", ad_type: "banner", click_url: "", sort_order: ag.creatives.length }] }
          : ag
      )
    );
  };

  const removeCreative = (agIdx: number, crIdx: number) => {
    setAdGroups((prev) =>
      prev.map((ag, i) =>
        i === agIdx
          ? { ...ag, creatives: ag.creatives.filter((_, j) => j !== crIdx) }
          : ag
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !campaign) return;
    setSaving(true);
    setError(null);
    setConflictMessage(null);
    const budgetNum = parseFloat(budget);
    if (Number.isNaN(budgetNum) || budgetNum < 0) {
      setError("Budget must be a non-negative number");
      setSaving(false);
      return;
    }
    const ad_groups = adGroups.map((ag) => ({
      id: ag.id ?? null,
      country_targets: ag.country_targets || null,
      platform_targets: ag.platform_targets || null,
      browser_targets: ag.browser_targets || null,
      timezone_targets: ag.timezone_targets || null,
      ssp_id_whitelist: ag.ssp_id_whitelist || null,
      ssp_id_blacklist: ag.ssp_id_blacklist || null,
      source_id_whitelist: ag.source_id_whitelist || null,
      source_id_blacklist: ag.source_id_blacklist || null,
      sort_order: ag.sort_order,
      creatives: ag.creatives.map((cr) => ({
        id: cr.id ?? null,
        name: cr.name,
        ad_type: cr.ad_type,
        click_url: cr.click_url || null,
        sort_order: cr.sort_order,
      })),
    }));
    campaignApi
      .update(id, { name, budget: budgetNum, status, version: campaign.version, ad_groups })
      .then((updated) => {
        setCampaign(updated);
        setBudget(String(updated.budget));
        setStatus(updated.status);
        const groups = (updated.ad_groups ?? []).map(toEdit);
        setAdGroups(groups);
        setExpanded(groups.map(() => false));
      })
      .catch((e: Error & { status?: number }) => {
        if (e.status === 409) {
          setConflictMessage(e.message || "Campaign was updated by someone else; please refresh and try again.");
        } else {
          setError(e.message);
        }
      })
      .finally(() => setSaving(false));
  };

  if (loading) return (
    <main className="campaign-edit">
      <div className="campaign-edit__skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="campaign-edit__skeleton-field shimmer" />
        ))}
      </div>
    </main>
  );
  if (error && !campaign) return <main className="campaign-edit"><p className="campaign-edit__form-error">Error: {error}</p></main>;
  if (!campaign) return <main className="campaign-edit"><p className="campaign-edit__form-error">Campaign not found.</p></main>;

  const readOnly = campaign.status === "archive";

  return (
    <main className="campaign-edit">
      <h1 className="campaign-edit__heading">Edit campaign</h1>
      {readOnly && (
        <div className="campaign-edit__archived-notice" data-testid="archived-notice">
          Archived campaigns are view-only
        </div>
      )}
      {conflictMessage && (
        <div role="alert" className="campaign-edit__conflict">
          <p>{conflictMessage}</p>
          <button type="button" className="campaign-edit__btn campaign-edit__btn--secondary" onClick={loadCampaign}>Refresh</button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="campaign-edit__field">
          <label className="campaign-edit__label" htmlFor="campaign-name">Name</label>
          <input id="campaign-name" className="campaign-edit__input" value={name} onChange={(e) => setName(e.target.value)} required disabled={readOnly} />
        </div>
        <div className="campaign-edit__field">
          <label className="campaign-edit__label" htmlFor="campaign-budget">Budget</label>
          <input id="campaign-budget" className="campaign-edit__input" type="number" min={0} step="any" value={budget} onChange={(e) => setBudget(e.target.value)} disabled={readOnly} />
        </div>
        <div className="campaign-edit__field">
          <label className="campaign-edit__label" htmlFor="campaign-status">Status</label>
          <select id="campaign-status" className="campaign-edit__select" value={status} onChange={(e) => setStatus(e.target.value)} disabled={readOnly}>
            <option value="active">active</option>
            <option value="pause">pause</option>
            <option value="archive">archive</option>
          </select>
        </div>

        <AdGroupsSection
          adGroups={adGroups}
          expanded={expanded}
          readOnly={readOnly}
          onToggle={toggleExpanded}
          onAddAdGroup={addAdGroup}
          onRemoveAdGroup={removeAdGroup}
          onUpdateAdGroup={updateAdGroup}
          onAddCreative={addCreative}
          onRemoveCreative={removeCreative}
          onUpdateCreative={updateCreative}
        />

        {error && <p className="campaign-edit__form-error">{error}</p>}
        <div className="campaign-edit__form-actions">
          {!readOnly && (
            <button type="submit" className="campaign-edit__btn campaign-edit__btn--primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </form>
      <Link to="/campaigns" className="campaign-edit__back-link">← Back to list</Link>
    </main>
  );
}
