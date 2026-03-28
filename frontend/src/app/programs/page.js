'use client';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { INSTITUTIONS, CAMPUSES, DEPARTMENTS, PROGRAMS, COURSE_TYPES, ENTRY_TYPES, QUOTA_TYPES } from '../../lib/constants';

const EMPTY_FORM = {
  institution_name: '', campus_name: '', department_name: '',
  program_name: '', course_type: 'UG', entry_type: 'Regular', total_intake: '',
  quotas: [{ quota_type: 'KCET', total_seats: '' }],
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState(null);
  const [quotaMap, setQuotaMap] = useState({});

  useEffect(() => { loadPrograms(); }, []);

  async function loadPrograms() {
    try { setPrograms(await api.getPrograms()); }
    catch (e) { setError(e.message); }
  }

  async function loadQuotas(programId) {
    if (quotaMap[programId]) {
      setExpandedProgram(expandedProgram === programId ? null : programId);
      return;
    }
    try {
      const quotas = await api.getProgramQuotas(programId);
      setQuotaMap(prev => ({ ...prev, [programId]: quotas }));
      setExpandedProgram(programId);
    } catch (e) { setError(e.message); }
  }

  function setField(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function addQuota() {
    const used = form.quotas.map(q => q.quota_type);
    const next = QUOTA_TYPES.find(t => !used.includes(t));
    if (!next) return;
    setForm(f => ({ ...f, quotas: [...f.quotas, { quota_type: next, total_seats: '' }] }));
  }

  function removeQuota(i) {
    setForm(f => ({ ...f, quotas: f.quotas.filter((_, idx) => idx !== i) }));
  }

  function setQuota(i, key, val) {
    setForm(f => {
      const quotas = [...f.quotas];
      quotas[i] = { ...quotas[i], [key]: val };
      return { ...f, quotas };
    });
  }

  // Live validation: show quota sum vs intake
  const quotaSum = form.quotas.reduce((s, q) => s + (Number(q.total_seats) || 0), 0);
  const intakeNum = Number(form.total_intake) || 0;
  const quotaValid = intakeNum > 0 && quotaSum === intakeNum;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!quotaValid) {
      setError(`Quota sum (${quotaSum}) must equal total intake (${intakeNum})`);
      return;
    }
    setLoading(true);
    try {
      await api.createProgram({
        ...form,
        total_intake: intakeNum,
        quotas: form.quotas.map(q => ({ ...q, total_seats: Number(q.total_seats) })),
      });
      setSuccess('Program created successfully!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadPrograms();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Programs</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Configure programs and define quota seats</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
          {showForm ? 'Cancel' : '+ New Program'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {/* Create Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '1.25rem' }}>New Program</h2>
          <form onSubmit={handleSubmit}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Institution</label>
                <select className="input" value={form.institution_name} onChange={e => setField('institution_name', e.target.value)} required>
                  <option value="">Select…</option>
                  {INSTITUTIONS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Campus</label>
                <select className="input" value={form.campus_name} onChange={e => setField('campus_name', e.target.value)} required>
                  <option value="">Select…</option>
                  {CAMPUSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Department</label>
                <select className="input" value={form.department_name} onChange={e => setField('department_name', e.target.value)} required>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="label">Program</label>
                <select className="input" value={form.program_name} onChange={e => setField('program_name', e.target.value)} required>
                  <option value="">Select…</option>
                  {PROGRAMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Course Type</label>
                <select className="input" value={form.course_type} onChange={e => setField('course_type', e.target.value)}>
                  {COURSE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Entry Type</label>
                <select className="input" value={form.entry_type} onChange={e => setField('entry_type', e.target.value)}>
                  {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Total Intake</label>
                <input className="input" type="number" min="1" value={form.total_intake}
                  onChange={e => setField('total_intake', e.target.value)} required placeholder="e.g. 60" />
              </div>
            </div>

            {/* Quotas */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div className="section-title" style={{ marginBottom: 0 }}>Quota Seats</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 500,
                    color: quotaValid ? 'var(--success)' : (quotaSum > intakeNum ? 'var(--danger)' : 'var(--text-muted)')
                  }}>
                    Sum: {quotaSum} / {intakeNum || '?'}
                    {intakeNum > 0 && (quotaValid ? ' ✓' : ' ✗')}
                  </span>
                  {form.quotas.length < QUOTA_TYPES.length && (
                    <button type="button" className="btn-secondary" style={{ padding: '3px 10px', fontSize: '12px' }} onClick={addQuota}>
                      + Add Quota
                    </button>
                  )}
                </div>
              </div>

              {form.quotas.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <select className="input" style={{ width: '160px' }} value={q.quota_type}
                    onChange={e => setQuota(i, 'quota_type', e.target.value)}>
                    {QUOTA_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input className="input" type="number" min="0" placeholder="Seats"
                    value={q.total_seats} onChange={e => setQuota(i, 'total_seats', e.target.value)} required />
                  {form.quotas.length > 1 && (
                    <button type="button" onClick={() => removeQuota(i)}
                      style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button className="btn-primary" type="submit" disabled={loading || !quotaValid}>
              {loading ? 'Creating…' : 'Create Program'}
            </button>
          </form>
        </div>
      )}

      {/* Programs List */}
      <div className="card">
        <div className="section-title">All Programs ({programs.length})</div>
        {programs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>
            No programs yet. Create one above.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Institution</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Intake</th>
                  <th>Filled</th>
                  <th>Quotas</th>
                </tr>
              </thead>
              <tbody>
                {programs.map(p => (
                  <>
                    <tr key={p.id}>
                      <td><strong>{p.program_name}</strong> <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.course_type}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.institution_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.department_name}</td>
                      <td><span className="badge badge-gray">{p.entry_type}</span></td>
                      <td>{p.total_intake}</td>
                      <td>
                        <span style={{ color: p.total_filled >= p.total_intake ? 'var(--danger)' : 'var(--success)' }}>
                          {p.total_filled}
                        </span>
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '2px 10px', fontSize: '11px' }}
                          onClick={() => loadQuotas(p.id)}>
                          {expandedProgram === p.id ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {expandedProgram === p.id && quotaMap[p.id] && (
                      <tr key={`${p.id}-quotas`}>
                        <td colSpan={7} style={{ background: 'var(--accent-light)', padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {quotaMap[p.id].map(q => (
                              <div key={q.id} style={{
                                background: '#fff', border: '1px solid var(--border)',
                                borderRadius: '6px', padding: '0.5rem 0.85rem', minWidth: '140px'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>{q.quota_type}</div>
                                <div style={{ fontSize: '15px', fontWeight: 600 }}>
                                  {q.filled_seats} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>/ {q.total_seats}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: q.total_seats - q.filled_seats === 0 ? 'var(--danger)' : 'var(--success)' }}>
                                  {q.total_seats - q.filled_seats} remaining
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
