'use client';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '32px', fontFamily: 'var(--font-display)', color: accent || 'var(--text)' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

const docBadge = (s) => {
  if (s === 'Verified') return 'badge-green';
  if (s === 'Submitted') return 'badge-yellow';
  return 'badge-red';
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading dashboard…</div>;
  if (error) return <div className="error-msg">{error}</div>;
  if (!data) return null;

  const { programStats, quotaStats, pendingDocs, pendingFees } = data;

  const totalIntake = programStats.reduce((s, p) => s + p.total_intake, 0);
  const totalFilled = programStats.reduce((s, p) => s + Number(p.total_filled), 0);
  const totalRemaining = totalIntake - totalFilled;
  const fillPct = totalIntake > 0 ? Math.round((totalFilled / totalIntake) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Overview of seat filling, quotas, and pending actions</p>
      </div>

      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Intake" value={totalIntake} sub="across all programs" />
        <StatCard label="Seats Filled" value={totalFilled} sub={`${fillPct}% filled`} accent="var(--accent)" />
        <StatCard label="Remaining" value={totalRemaining} sub="seats available" accent={totalRemaining === 0 ? 'var(--danger)' : 'var(--success)'} />
        <StatCard label="Pending Actions" value={pendingDocs.length + pendingFees.length} sub="docs + fees pending" accent="var(--warning)" />
      </div>

      {/* Overall fill bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Overall Fill Rate</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{totalFilled} / {totalIntake} ({fillPct}%)</span>
        </div>
        <div style={{ background: 'var(--border)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${fillPct}%`,
            background: fillPct >= 90 ? 'var(--danger)' : fillPct >= 60 ? 'var(--warning)' : 'var(--accent)',
            borderRadius: '6px', transition: 'width 0.4s',
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Program-wise breakdown */}
        <div className="card">
          <div className="section-title">Program-wise Seats</div>
          {programStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No programs configured.</p>
          ) : (
            programStats.map(p => {
              const pct = p.total_intake > 0 ? Math.round((p.total_filled / p.total_intake) * 100) : 0;
              return (
                <div key={p.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 500 }}>{p.program_name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{p.total_filled} / {p.total_intake}</span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: pct >= 90 ? 'var(--danger)' : 'var(--accent)',
                      borderRadius: '4px',
                    }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quota-wise breakdown */}
        <div className="card">
          <div className="section-title">Quota-wise Status</div>
          {quotaStats.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No quotas configured.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Quota</th>
                    <th>Filled</th>
                    <th>Left</th>
                  </tr>
                </thead>
                <tbody>
                  {quotaStats.map((q, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '12px' }}>{q.program_name}</td>
                      <td><span className="badge badge-blue">{q.quota_type}</span></td>
                      <td>{q.filled_seats} / {q.total_seats}</td>
                      <td>
                        <span style={{ color: q.remaining === 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>
                          {q.remaining}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Pending documents */}
        <div className="card">
          <div className="section-title" style={{ color: 'var(--warning)' }}>
            Pending / Unverified Documents ({pendingDocs.length})
          </div>
          {pendingDocs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>All documents verified ✓</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Program</th><th>Quota</th><th>Doc Status</th></tr></thead>
                <tbody>
                  {pendingDocs.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td style={{ fontSize: '12px' }}>{d.program_name}</td>
                      <td><span className="badge badge-blue">{d.quota_type}</span></td>
                      <td><span className={`badge ${docBadge(d.document_status)}`}>{d.document_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending fees */}
        <div className="card">
          <div className="section-title" style={{ color: 'var(--danger)' }}>
            Fee Pending ({pendingFees.length})
          </div>
          {pendingFees.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>All fees collected ✓</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Program</th><th>Quota</th><th>Fee</th></tr></thead>
                <tbody>
                  {pendingFees.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 500 }}>{f.name}</td>
                      <td style={{ fontSize: '12px' }}>{f.program_name}</td>
                      <td><span className="badge badge-blue">{f.quota_type}</span></td>
                      <td><span className="badge badge-red">Pending</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
