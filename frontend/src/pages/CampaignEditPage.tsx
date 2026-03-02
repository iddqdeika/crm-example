import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { campaignApi, type AdGroupDto, type CreativeDto, type CampaignDetail } from "../services/api";

type CreativeEdit = {
  id?: string;
  name: string;
  ad_type: string;
  click_url: string;
  sort_order: number;
};

type AdGroupEdit = {
  id?: string;
  country_targets: string;
  platform_targets: string;
  browser_targets: string;
  timezone_targets: string;
  ssp_id_whitelist: string;
  ssp_id_blacklist: string;
  source_id_whitelist: string;
  source_id_blacklist: string;
  sort_order: number;
  creatives: CreativeEdit[];
};

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

const emptyAdGroup = (sortOrder: number): AdGroupEdit => ({
  country_targets: "",
  platform_targets: "",
  browser_targets: "",
  timezone_targets: "",
  ssp_id_whitelist: "",
  ssp_id_blacklist: "",
  source_id_whitelist: "",
  source_id_blacklist: "",
  sort_order: sortOrder,
  creatives: [],
});

const emptyCreative = (sortOrder: number): CreativeEdit => ({
  name: "",
  ad_type: "banner",
  click_url: "",
  sort_order: sortOrder,
});

export default function CampaignEditPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("active");
  const [adGroups, setAdGroups] = useState<AdGroupEdit[]>([]);
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
        setAdGroups((c.ad_groups ?? []).map(toEdit));
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const updateAdGroup = (index: number, updates: Partial<AdGroupEdit>) => {
    setAdGroups((prev) =>
      prev.map((ag, i) => (i === index ? { ...ag, ...updates } : ag))
    );
  };

  const addAdGroup = () => {
    setAdGroups((prev) => [...prev, emptyAdGroup(prev.length)]);
  };

  const removeAdGroup = (index: number) => {
    setAdGroups((prev) => prev.filter((_, i) => i !== index));
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
          ? { ...ag, creatives: [...ag.creatives, emptyCreative(ag.creatives.length)] }
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
        setAdGroups((updated.ad_groups ?? []).map(toEdit));
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

  if (loading) return <main className="page"><p>Loading…</p></main>;
  if (error && !campaign) return <main className="page"><p>Error: {error}</p></main>;
  if (!campaign) return <main className="page"><p>Campaign not found.</p></main>;

  const readOnly = campaign.status === "archive";

  return (
    <main className="page">
      <h1>Edit campaign</h1>
      {readOnly && (
        <div className="campaign-edit__archived-notice" data-testid="archived-notice">
          Archived campaigns are view-only
        </div>
      )}
      {conflictMessage && (
        <div role="alert" className="campaign-edit__conflict">
          <p>{conflictMessage}</p>
          <button type="button" onClick={loadCampaign}>Refresh</button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="campaign-name">Name</label>
          <input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={readOnly} />
        </div>
        <div>
          <label htmlFor="campaign-budget">Budget</label>
          <input id="campaign-budget" type="number" min={0} step="any" value={budget} onChange={(e) => setBudget(e.target.value)} disabled={readOnly} />
        </div>
        <div>
          <label htmlFor="campaign-status">Status</label>
          <select id="campaign-status" value={status} onChange={(e) => setStatus(e.target.value)} disabled={readOnly}>
            <option value="active">active</option>
            <option value="pause">pause</option>
            <option value="archive">archive</option>
          </select>
        </div>

        <section className="campaign-edit__ad-groups" aria-label="Ad groups">
          <h2>Ad groups</h2>
          {adGroups.map((ag, agIdx) => (
            <div key={ag.id ?? `new-${agIdx}`} className="campaign-edit__ad-group-block" data-testid="ad-group-block">
              <div className="campaign-edit__ad-group-header">
                <span>Ad group {agIdx + 1}</span>
                {!readOnly && <button type="button" onClick={() => removeAdGroup(agIdx)} data-testid="ad-group-delete">Delete</button>}
              </div>
              <div className="campaign-edit__ad-group-fields">
                <div><label htmlFor={`ag-country-${agIdx}`}>Country targets</label><input id={`ag-country-${agIdx}`} value={ag.country_targets} onChange={(e) => updateAdGroup(agIdx, { country_targets: e.target.value })} placeholder="e.g. US,CA" disabled={readOnly} /></div>
                <div><label htmlFor={`ag-platform-${agIdx}`}>Platform targets</label><input id={`ag-platform-${agIdx}`} value={ag.platform_targets} onChange={(e) => updateAdGroup(agIdx, { platform_targets: e.target.value })} disabled={readOnly} /></div>
                <div><label htmlFor={`ag-browser-${agIdx}`}>Browser targets</label><input id={`ag-browser-${agIdx}`} value={ag.browser_targets} onChange={(e) => updateAdGroup(agIdx, { browser_targets: e.target.value })} disabled={readOnly} /></div>
                <div><label htmlFor={`ag-timezone-${agIdx}`}>Timezone targets</label><input id={`ag-timezone-${agIdx}`} value={ag.timezone_targets} onChange={(e) => updateAdGroup(agIdx, { timezone_targets: e.target.value })} disabled={readOnly} /></div>
                <div><label htmlFor={`ag-ssp-w-${agIdx}`}>SSP ID whitelist</label><input id={`ag-ssp-w-${agIdx}`} value={ag.ssp_id_whitelist} onChange={(e) => updateAdGroup(agIdx, { ssp_id_whitelist: e.target.value })} disabled={readOnly} /></div>
                <div><label htmlFor={`ag-ssp-b-${agIdx}`}>SSP ID blacklist</label><input id={`ag-ssp-b-${agIdx}`} value={ag.ssp_id_blacklist} onChange={(e) => updateAdGroup(agIdx, { ssp_id_blacklist: e.target.value })} disabled={readOnly} /></div>
                <div><label htmlFor={`ag-src-w-${agIdx}`}>Source ID whitelist</label><input id={`ag-src-w-${agIdx}`} value={ag.source_id_whitelist} onChange={(e) => updateAdGroup(agIdx, { source_id_whitelist: e.target.value })} disabled={readOnly} /></div>
                <div><label htmlFor={`ag-src-b-${agIdx}`}>Source ID blacklist</label><input id={`ag-src-b-${agIdx}`} value={ag.source_id_blacklist} onChange={(e) => updateAdGroup(agIdx, { source_id_blacklist: e.target.value })} disabled={readOnly} /></div>
              </div>

              <div className="campaign-edit__creatives" data-testid="creatives-section">
                <h3>Creatives</h3>
                {ag.creatives.map((cr, crIdx) => (
                  <div key={cr.id ?? `new-cr-${crIdx}`} className="campaign-edit__creative-row" data-testid="creative-row">
                    <input aria-label="Creative name" value={cr.name} onChange={(e) => updateCreative(agIdx, crIdx, { name: e.target.value })} placeholder="Name" required disabled={readOnly} />
                    <select aria-label="Ad type" value={cr.ad_type} onChange={(e) => updateCreative(agIdx, crIdx, { ad_type: e.target.value })} disabled={readOnly}>
                      <option value="banner">banner</option>
                      <option value="native">native</option>
                      <option value="video">video</option>
                    </select>
                    <input aria-label="Click URL" value={cr.click_url} onChange={(e) => updateCreative(agIdx, crIdx, { click_url: e.target.value })} placeholder="Click URL" disabled={readOnly} />
                    {!readOnly && <button type="button" onClick={() => removeCreative(agIdx, crIdx)} data-testid="creative-delete">Delete</button>}
                  </div>
                ))}
                {!readOnly && <button type="button" onClick={() => addCreative(agIdx)} data-testid="add-creative">Add creative</button>}
              </div>
            </div>
          ))}
          {!readOnly && <button type="button" onClick={addAdGroup} data-testid="add-ad-group">Add ad group</button>}
        </section>

        {error && <p className="form-error">{error}</p>}
        {!readOnly && <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>}
      </form>
      <p><Link to="/campaigns">Back to list</Link></p>
    </main>
  );
}
