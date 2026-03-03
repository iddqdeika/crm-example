import "./CampaignNewPage.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { campaignApi } from "../services/api";
import AdGroupsSection, {
  type AdGroupEdit,
  type CreativeEdit,
  emptyAdGroup,
} from "../components/AdGroupsSection";

export default function CampaignNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("0");
  const [status, setStatus] = useState("active");
  const [adGroups, setAdGroups] = useState<AdGroupEdit[]>([]);
  const [expanded, setExpanded] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleExpanded = (index: number) => {
    setExpanded((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const addAdGroup = () => {
    setAdGroups((prev) => [...prev, emptyAdGroup(prev.length)]);
    setExpanded((prev) => [...prev, true]);
  };

  const removeAdGroup = (index: number) => {
    setAdGroups((prev) => prev.filter((_, i) => i !== index));
    setExpanded((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAdGroup = (index: number, updates: Partial<AdGroupEdit>) => {
    setAdGroups((prev) => prev.map((ag, i) => (i === index ? { ...ag, ...updates } : ag)));
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
        i === agIdx ? { ...ag, creatives: ag.creatives.filter((_, j) => j !== crIdx) } : ag
      )
    );
  };

  const updateCreative = (agIdx: number, crIdx: number, updates: Partial<CreativeEdit>) => {
    setAdGroups((prev) =>
      prev.map((ag, i) =>
        i === agIdx
          ? { ...ag, creatives: ag.creatives.map((cr, j) => (j === crIdx ? { ...cr, ...updates } : cr)) }
          : ag
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const budgetNum = parseFloat(budget);
    if (Number.isNaN(budgetNum) || budgetNum < 0) {
      setError("Budget must be a non-negative number");
      setSaving(false);
      return;
    }
    const ad_groups = adGroups.map((ag) => ({
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
        name: cr.name,
        ad_type: cr.ad_type,
        click_url: cr.click_url || null,
        sort_order: cr.sort_order,
      })),
    }));
    campaignApi
      .create({ name, budget: budgetNum, status, ad_groups })
      .then((c) => navigate(`/campaigns/${c.id}`))
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false));
  };

  return (
    <main className="campaign-new">
      <h1 className="campaign-new__heading">New campaign</h1>
      <form className="campaign-new__form" onSubmit={handleSubmit}>
        <div className="campaign-new__field">
          <label className="campaign-new__label" htmlFor="campaign-name">Name</label>
          <input
            id="campaign-name"
            className="campaign-new__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="campaign-new__field">
          <label className="campaign-new__label" htmlFor="campaign-budget">Budget</label>
          <input
            id="campaign-budget"
            className="campaign-new__input"
            type="number"
            min={0}
            step="any"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div className="campaign-new__field">
          <label className="campaign-new__label" htmlFor="campaign-status">Status</label>
          <select
            id="campaign-status"
            className="campaign-new__select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">active</option>
            <option value="pause">pause</option>
            <option value="archive">archive</option>
          </select>
        </div>

        <AdGroupsSection
          adGroups={adGroups}
          expanded={expanded}
          onToggle={toggleExpanded}
          onAddAdGroup={addAdGroup}
          onRemoveAdGroup={removeAdGroup}
          onUpdateAdGroup={updateAdGroup}
          onAddCreative={addCreative}
          onRemoveCreative={removeCreative}
          onUpdateCreative={updateCreative}
        />

        {error && <p className="campaign-new__error">{error}</p>}
        <button type="submit" className="campaign-new__submit" disabled={saving}>
          {saving ? "Creating…" : "Create"}
        </button>
      </form>
      <Link to="/campaigns" className="campaign-new__back-link">← Back to list</Link>
    </main>
  );
}
