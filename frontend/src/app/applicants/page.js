'use client';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { CATEGORIES, ENTRY_TYPES, QUOTA_TYPES, GENDERS, DOC_STATUSES } from '../../lib/constants';
import { useRole } from '../../lib/RoleContext';

const EMPTY_FORM = {
  name: '', email: '', phone: '', date_of_birth: '', gender: '',
  category: '', entry_type: 'Regular', quota_type: 'KCET',
  marks: '', allotment_number: '', address: '',
};

const docBadge = (s) => {
  if (s === 'Verified') return 'badge-green';
  if (s === 'Submitted') return 'badge-yellow';
  return 'badge-red';
};

export default function ApplicantsPage() {
  const { role } = useRole();
  const [applicants, setApplicants] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [updatingDoc, setUpdatingDoc] = useState(null);

  const isAdmissionOfficer = role === 'Admission Officer';

  useEffect(() => { loadApplicants(); }, []);

  async function loadApplicants() {
    try { setApplicants(await api.getApplicants()); }
    catch (e) { setError(e.message); }
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const needsAllotment = form.quota_type === 'KCET' || form.quota_type === 'COMEDK';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      await api.createApplicant(form);
      setSuccess('Applicant created successfully!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadApplicants();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDocStatus(applicantId, status) {
    setUpdatingDoc(applicantId);
    try {
      await api.updateDocumentStatus(applicantId, status);
      setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, document_status: status } : a));
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdatingDoc(null);
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Applicants</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create and manage applicant records</p>
        </div>
        {isAdmissionOfficer && (
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}>
            {showForm ? 'Cancel' : '+ New Applicant'}
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      {/* Create Form */}
      {showForm && isAdmissionOfficer && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '1.25rem' }}>New Applicant</h2>
          <form onSubmit={handleSubmit}>
            {/* Personal details */}
            <div className="section-title">Personal Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={form.name} onChange={e => setField('name', e.target.value)} required placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@example.com" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="10-digit number" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="label">Date of Birth</label>
                <input className="input" type="date" value={form.date_of_birth} onChange={e => setField('date_of_birth', e.target.value)} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={e => setField('gender', e.target.value)}>
                  <option value="">Select…</option>
                  {GENDERS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="City, State" />
              </div>
            </div>

            {/* Academic details */}
            <div className="section-title">Academic & Admission Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Category *</label>
                <select className="input" value={form.category} onChange={e => setField('category', e.target.value)} required>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Entry Type *</label>
                <select className="input" value={form.entry_type} onChange={e => setField('entry_type', e.target.value)}>
                  {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Quota Type *</label>
                <select className="input" value={form.quota_type} onChange={e => setField('quota_type', e.target.value)}>
                  {QUOTA_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Marks / Score</label>
                <input className="input" type="number" value={form.marks} onChange={e => setField('marks', e.target.value)} placeholder="e.g. 145.00" />
              </div>
            </div>

            {/* Allotment number — only for govt quotas */}
            {needsAllotment && (
              <div style={{ marginBottom: '1.25rem', maxWidth: '320px' }}>
                <label className="label">Allotment Number * ({form.quota_type})</label>
                <input className="input" value={form.allotment_number}
                  onChange={e => setField('allotment_number', e.target.value)}
                  required={needsAllotment} placeholder="e.g. KCET-2026-00123" />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Required for government quota applicants
                </div>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Create Applicant'}
            </button>
          </form>
        </div>
      )}

      {/* Applicants Table */}
      <div className="card">
        <div className="section-title">All Applicants ({applicants.length})</div>
        {applicants.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>
            No applicants yet. Create one above.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Quota</th>
                  <th>Entry</th>
                  <th>Marks</th>
                  <th>Doc Status</th>
                  <th>Allotment #</th>
                  <th>Admission</th>
                  <th>Update Doc</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.name}</div>
                      {a.email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{a.email}</div>}
                    </td>
                    <td><span className="badge badge-gray">{a.category}</span></td>
                    <td><span className="badge badge-blue">{a.quota_type}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.entry_type}</td>
                    <td>{a.marks || '—'}</td>
                    <td><span className={`badge ${docBadge(a.document_status)}`}>{a.document_status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{a.allotment_number || '—'}</td>
                    <td>
                      {a.admission_id
                        ? <span className="badge badge-green">Allocated</span>
                        : <span className="badge badge-gray">Pending</span>
                      }
                    </td>
                    <td>
                      <select
                        className="input"
                        style={{ width: '120px', padding: '3px 6px', fontSize: '12px' }}
                        value={a.document_status}
                        disabled={updatingDoc === a.id || !isAdmissionOfficer}
                        onChange={e => handleDocStatus(a.id, e.target.value)}
                      >
                        {DOC_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
