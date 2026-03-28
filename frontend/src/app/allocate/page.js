'use client';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

export default function AllocatePage() {
  const [applicants, setApplicants] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [quotas, setQuotas] = useState([]);

  const [selectedApplicant, setSelectedApplicant] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedQuota, setSelectedQuota] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingQuotas, setLoadingQuotas] = useState(false);

  useEffect(() => {
    api.getUnallocated().then(setApplicants).catch(e => setError(e.message));
    api.getPrograms().then(setPrograms).catch(e => setError(e.message));
  }, []);

  // Load quotas when program is selected — show availability immediately
  useEffect(() => {
    if (!selectedProgram) { setQuotas([]); setSelectedQuota(''); return; }
    setLoadingQuotas(true);
    api.getProgramQuotas(selectedProgram)
      .then(q => { setQuotas(q); setSelectedQuota(''); })
      .catch(e => setError(e.message))
      .finally(() => setLoadingQuotas(false));
  }, [selectedProgram]);

  const selectedApplicantObj = applicants.find(a => String(a.id) === String(selectedApplicant));
  const selectedQuotaObj = quotas.find(q => String(q.id) === String(selectedQuota));
  const quotaFull = selectedQuotaObj && selectedQuotaObj.filled_seats >= selectedQuotaObj.total_seats;
  const remaining = selectedQuotaObj ? selectedQuotaObj.total_seats - selectedQuotaObj.filled_seats : null;

  async function handleAllocate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (quotaFull) {
      setError('Cannot allocate: quota is full.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.allocateSeat({
        applicant_id: Number(selectedApplicant),
        program_id: Number(selectedProgram),
        quota_id: Number(selectedQuota),
      });
      setSuccess(`Seat allocated and locked! Admission ID: ${res.admissionId}`);
      // Refresh unallocated list — allocated applicant disappears
      const updated = await api.getUnallocated();
      setApplicants(updated);
      // Refresh quotas to show updated count
      const updatedQuotas = await api.getProgramQuotas(selectedProgram);
      setQuotas(updatedQuotas);
      setSelectedApplicant('');
      setSelectedQuota('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Seat Allocation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Select an applicant, program, and quota. Seat is locked immediately after allocation.
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Allocation Form */}
        <div className="card">
          <h2 style={{ fontSize: '17px', marginBottom: '1.25rem' }}>Allocate a Seat</h2>
          <form onSubmit={handleAllocate}>
            {/* Applicant */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Applicant (unallocated only) *</label>
              <select className="input" value={selectedApplicant} onChange={e => setSelectedApplicant(e.target.value)} required>
                <option value="">Select applicant…</option>
                {applicants.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.quota_type} / {a.category}
                  </option>
                ))}
              </select>
              {applicants.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  All applicants are already allocated.
                </div>
              )}
            </div>

            {/* Applicant Info Card */}
            {selectedApplicantObj && (
              <div style={{
                background: 'var(--accent-light)', border: '1px solid #c5dccb',
                borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem',
                fontSize: '12px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Category:</span> <strong>{selectedApplicantObj.category}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Quota:</span> <strong>{selectedApplicantObj.quota_type}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Entry:</span> <strong>{selectedApplicantObj.entry_type}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Marks:</span> <strong>{selectedApplicantObj.marks || '—'}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Docs:</span> <strong>{selectedApplicantObj.document_status}</strong></div>
                  {selectedApplicantObj.allotment_number && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Allotment #:</span> <strong>{selectedApplicantObj.allotment_number}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Program */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Program *</label>
              <select className="input" value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} required>
                <option value="">Select program…</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.program_name} ({p.course_type}) — {p.institution_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quota — shows remaining seats */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Quota *</label>
              {loadingQuotas ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>Loading quotas…</div>
              ) : (
                <select className="input" value={selectedQuota} onChange={e => setSelectedQuota(e.target.value)}
                  required disabled={!selectedProgram || quotas.length === 0}>
                  <option value="">Select quota…</option>
                  {quotas.map(q => {
                    const rem = q.total_seats - q.filled_seats;
                    return (
                      <option key={q.id} value={q.id} disabled={rem === 0}>
                        {q.quota_type} — {rem} of {q.total_seats} seats available{rem === 0 ? ' [FULL]' : ''}
                      </option>
                    );
                  })}
                </select>
              )}

              {/* Seat availability indicator */}
              {selectedQuotaObj && (
                <div style={{
                  marginTop: '8px', padding: '0.6rem 0.85rem',
                  borderRadius: '6px', fontSize: '12px',
                  background: quotaFull ? 'var(--danger-light)' : 'var(--success-light)',
                  color: quotaFull ? 'var(--danger)' : 'var(--success)',
                  border: `1px solid ${quotaFull ? '#f5c6c3' : '#b7dfc6'}`,
                }}>
                  {quotaFull
                    ? `⛔ Quota full — ${selectedQuotaObj.total_seats} / ${selectedQuotaObj.total_seats} seats filled. Allocation blocked.`
                    : `✓ ${remaining} seat${remaining !== 1 ? 's' : ''} available in ${selectedQuotaObj.quota_type}`
                  }
                </div>
              )}
            </div>

            <button className="btn-primary" type="submit"
              disabled={loading || !selectedApplicant || !selectedProgram || !selectedQuota || quotaFull}>
              {loading ? 'Allocating…' : 'Allocate & Lock Seat'}
            </button>
          </form>
        </div>

        {/* Quota Overview Panel */}
        <div>
          {selectedProgram && quotas.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="section-title">Quota Status — Selected Program</div>
              {quotas.map(q => {
                const pct = Math.round((q.filled_seats / q.total_seats) * 100);
                const rem = q.total_seats - q.filled_seats;
                return (
                  <div key={q.id} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{q.quota_type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {q.filled_seats} / {q.total_seats} filled
                        &nbsp;·&nbsp;
                        <span style={{ color: rem === 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 500 }}>
                          {rem} left
                        </span>
                      </span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: rem === 0 ? 'var(--danger)' : 'var(--accent)',
                        borderRadius: '4px', transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card">
            <div className="section-title">How Allocation Works</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>① Select an unallocated applicant</div>
              <div>② Choose a program and quota</div>
              <div>③ System checks available seats</div>
              <div>④ Seat is <strong style={{ color: 'var(--text)' }}>locked immediately</strong> on allocation</div>
              <div>⑤ Quota counter updates in real time</div>
              <div style={{ marginTop: '8px', padding: '6px 8px', background: 'var(--warning-light)', color: 'var(--warning)', borderRadius: '4px' }}>
                Note: Even if fee is pending, the seat is reserved.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
