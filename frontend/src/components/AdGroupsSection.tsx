import "../pages/CampaignEditPage.css";

export type CreativeEdit = {
  id?: string;
  name: string;
  ad_type: string;
  click_url: string;
  sort_order: number;
};

export type AdGroupEdit = {
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

export const emptyAdGroup = (sortOrder: number): AdGroupEdit => ({
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

export const emptyCreative = (sortOrder: number): CreativeEdit => ({
  name: "",
  ad_type: "banner",
  click_url: "",
  sort_order: sortOrder,
});

type Props = {
  adGroups: AdGroupEdit[];
  expanded: boolean[];
  readOnly?: boolean;
  onToggle: (index: number) => void;
  onAddAdGroup: () => void;
  onRemoveAdGroup: (index: number) => void;
  onUpdateAdGroup: (index: number, updates: Partial<AdGroupEdit>) => void;
  onAddCreative: (agIdx: number) => void;
  onRemoveCreative: (agIdx: number, crIdx: number) => void;
  onUpdateCreative: (agIdx: number, crIdx: number, updates: Partial<CreativeEdit>) => void;
};

export default function AdGroupsSection({
  adGroups,
  expanded,
  readOnly = false,
  onToggle,
  onAddAdGroup,
  onRemoveAdGroup,
  onUpdateAdGroup,
  onAddCreative,
  onRemoveCreative,
  onUpdateCreative,
}: Props) {
  return (
    <section className="campaign-edit__ad-groups" aria-label="Ad groups">
      <h2 className="campaign-edit__ad-groups-heading">Ad groups</h2>
      {adGroups.map((ag, agIdx) => (
        <div key={ag.id ?? `new-${agIdx}`} className="campaign-edit__ad-group-block" data-testid="ad-group-block">
          <div
            className={`campaign-edit__ad-group-header${expanded[agIdx] ? " is-expanded" : ""}`}
            onClick={() => onToggle(agIdx)}
            role="button"
            aria-expanded={expanded[agIdx]}
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") ? onToggle(agIdx) : undefined}
          >
            <span className="campaign-edit__ad-group-title">Ad group {agIdx + 1}</span>
            <span className="campaign-edit__ad-group-toggle">{expanded[agIdx] ? "▲" : "▼"}</span>
          </div>
          <div className={`campaign-edit__ad-group-body${expanded[agIdx] ? " is-expanded" : ""}`}>
            <div className="campaign-edit__ad-group-fields">
              {!readOnly && (
                <button type="button" className="campaign-edit__btn campaign-edit__btn--danger" onClick={() => onRemoveAdGroup(agIdx)} data-testid="ad-group-delete">
                  Delete ad group
                </button>
              )}
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-country-${agIdx}`}>Country targets</label><input id={`ag-country-${agIdx}`} className="campaign-edit__input" value={ag.country_targets} onChange={(e) => onUpdateAdGroup(agIdx, { country_targets: e.target.value })} placeholder="e.g. US,CA" disabled={readOnly} /></div>
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-platform-${agIdx}`}>Platform targets</label><input id={`ag-platform-${agIdx}`} className="campaign-edit__input" value={ag.platform_targets} onChange={(e) => onUpdateAdGroup(agIdx, { platform_targets: e.target.value })} disabled={readOnly} /></div>
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-browser-${agIdx}`}>Browser targets</label><input id={`ag-browser-${agIdx}`} className="campaign-edit__input" value={ag.browser_targets} onChange={(e) => onUpdateAdGroup(agIdx, { browser_targets: e.target.value })} disabled={readOnly} /></div>
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-timezone-${agIdx}`}>Timezone targets</label><input id={`ag-timezone-${agIdx}`} className="campaign-edit__input" value={ag.timezone_targets} onChange={(e) => onUpdateAdGroup(agIdx, { timezone_targets: e.target.value })} disabled={readOnly} /></div>
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-ssp-w-${agIdx}`}>SSP ID whitelist</label><input id={`ag-ssp-w-${agIdx}`} className="campaign-edit__input" value={ag.ssp_id_whitelist} onChange={(e) => onUpdateAdGroup(agIdx, { ssp_id_whitelist: e.target.value })} disabled={readOnly} /></div>
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-ssp-b-${agIdx}`}>SSP ID blacklist</label><input id={`ag-ssp-b-${agIdx}`} className="campaign-edit__input" value={ag.ssp_id_blacklist} onChange={(e) => onUpdateAdGroup(agIdx, { ssp_id_blacklist: e.target.value })} disabled={readOnly} /></div>
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-src-w-${agIdx}`}>Source ID whitelist</label><input id={`ag-src-w-${agIdx}`} className="campaign-edit__input" value={ag.source_id_whitelist} onChange={(e) => onUpdateAdGroup(agIdx, { source_id_whitelist: e.target.value })} disabled={readOnly} /></div>
              <div className="campaign-edit__field"><label className="campaign-edit__label" htmlFor={`ag-src-b-${agIdx}`}>Source ID blacklist</label><input id={`ag-src-b-${agIdx}`} className="campaign-edit__input" value={ag.source_id_blacklist} onChange={(e) => onUpdateAdGroup(agIdx, { source_id_blacklist: e.target.value })} disabled={readOnly} /></div>
            </div>

            <div className="campaign-edit__creatives" data-testid="creatives-section">
              <h3 className="campaign-edit__creatives-heading">Creatives</h3>
              {ag.creatives.map((cr, crIdx) => (
                <div key={cr.id ?? `new-cr-${crIdx}`} className="campaign-edit__creative-row" data-testid="creative-row">
                  <input className="campaign-edit__creative-input" aria-label="Creative name" value={cr.name} onChange={(e) => onUpdateCreative(agIdx, crIdx, { name: e.target.value })} placeholder="Name" required disabled={readOnly} />
                  <select className="campaign-edit__creative-select" aria-label="Ad type" value={cr.ad_type} onChange={(e) => onUpdateCreative(agIdx, crIdx, { ad_type: e.target.value })} disabled={readOnly}>
                    <option value="banner">banner</option>
                    <option value="native">native</option>
                    <option value="video">video</option>
                  </select>
                  <input className="campaign-edit__creative-input" aria-label="Click URL" value={cr.click_url} onChange={(e) => onUpdateCreative(agIdx, crIdx, { click_url: e.target.value })} placeholder="Click URL" disabled={readOnly} />
                  {!readOnly && (
                    <button type="button" className="campaign-edit__btn campaign-edit__btn--danger" onClick={() => onRemoveCreative(agIdx, crIdx)} data-testid="creative-delete">
                      Delete
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <button type="button" className="campaign-edit__btn campaign-edit__btn--secondary" onClick={() => onAddCreative(agIdx)} data-testid="add-creative">
                  Add creative
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {!readOnly && (
        <button type="button" className="campaign-edit__btn campaign-edit__btn--secondary" onClick={onAddAdGroup} data-testid="add-ad-group">
          Add ad group
        </button>
      )}
    </section>
  );
}
