import { useState } from 'react';

const ICON = { pass: '✓', warn: '!', fail: '✗', info: 'i' };
const LABEL = { pass: 'lolos', warn: 'peringatan', fail: 'gagal', info: 'info' };

/** Menu "Validasi data": hasil pemeriksaan kevalidan dari pipeline bulanan (validation.json). */
export default function ValidationReport({ validation }) {
  const [openId, setOpenId] = useState(null);
  if (!validation) return <p className="muted small">Laporan validasi belum tersedia.</p>;
  const { summary, checks, data_month: month, generated_at: at, totals } = validation;
  const groups = [...new Set(checks.map((c) => c.group))];

  return (
    <div className="validation">
      <p className="small">
        Data bulan <strong>{month}</strong> · diperiksa {new Date(at).toLocaleString('id-ID')}
        <br />
        <span className="muted">
          {totals.events} kejadian · {totals.anomalies} anomali · {totals.quakes ?? 0} gempa. Pembaruan otomatis tiap
          bulan; bila bulan belum berganti tidak ada upload, dan data hanya diunggah bila tidak ada pemeriksaan
          &quot;gagal&quot;.
        </span>
      </p>
      <div className="val-summary">
        {['pass', 'warn', 'fail'].map((s) => (
          <span key={s} className={`val-chip ${s}`}>
            {ICON[s]} {summary[s]} {LABEL[s]}
          </span>
        ))}
      </div>
      {groups.map((g) => (
        <div key={g}>
          <h4>{g}</h4>
          <ul className="val-list">
            {checks
              .filter((c) => c.group === g)
              .map((c) => (
                <li key={c.id}>
                  <button
                    className="val-row"
                    onClick={() => setOpenId(openId === c.id ? null : c.id)}
                    disabled={!c.items.length}
                  >
                    <span className={`val-icon ${c.status}`}>{ICON[c.status]}</span>
                    <span>{c.title}</span>
                    <span className="muted small">{c.detail}</span>
                  </button>
                  {openId === c.id && (
                    <ul className="val-items">
                      {c.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
