import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { campaignApi } from "../services/api";

export default function CampaignNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("0");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    campaignApi
      .create({ name, budget: budgetNum, status })
      .then((c) => navigate(`/campaigns/${c.id}`))
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false));
  };

  return (
    <main className="page">
      <h1>New campaign</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="campaign-name">Name</label>
          <input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="campaign-budget">Budget</label>
          <input
            id="campaign-budget"
            type="number"
            min={0}
            step="any"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="campaign-status">Status</label>
          <select
            id="campaign-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">active</option>
            <option value="pause">pause</option>
            <option value="archive">archive</option>
          </select>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</button>
      </form>
      <p><Link to="/campaigns">Back to list</Link></p>
    </main>
  );
}
