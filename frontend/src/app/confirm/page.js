'use client';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const statusBadge = (s) => s === 'confirmed' ? 'badge-green' : 'badge-yellow';
const feeBadge = (s) => s === 'Paid' ? 'badge-green' : 'badge-red';
const docBadge = (s) => {
  if (s === 'Verified') return 'badge-green';
  if (s === 'Submitted') return 'badge-yellow';
  return 'badge-red';
};

export default function ConfirmPage() {
  const [admissions, setAdmissions] = useState([]);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [loadingFee, setLoadingFee] = useState(null);
  const [loadingConfirm, setLoadingConfirm] = useState(null);

  useEffect(() => { loadAdmissions(); }, []);

  async function loadAdmissions() {
    try { setAdmissions(await api.getAdmissions()); }
    catch (e) { setError(e.message); }
  }

  async function handleFeeToggle(adm) {
    if (adm.status === 'confirmed') return; // immutable after confirmation
    const newStatus = adm.fee_status === 'Paid' ? 'Pending' : 'Paid';
    setLoadingFee(adm.id);
    try {
      await api.updateFeeStatus(adm.id, newStatus);
      setAdmissions(prev => prev.map(a => a.id === adm.id ? { ...a, fee_status: newStatus } : a));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingFee(null);
    }
  }

  async function handleConfirm(adm) {
    setError(''); setActionMsg('');
    setLoadingConfirm(adm.id);
    try {
      const res = await api.confirmAdmission(adm.id);
      setActionMsg(`Admission confirmed! Number: ${res.admission_number}`);
      loadAdmissions();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingConfirm(null);
    }
  }

  // Determine why confirm button is disabled
  function confirmBlockReason(adm) {
    if (adm.status === 'confirmed') return 'Already confirmed';
    if (adm.document_status !== 'Verified') return `Docs: ${adm.document_status}`;
    if (adm.fee_status !== 'Paid') return 'Fee pending';
    return null; // can confirm
  }

  const allocated = admissions.filter(a => a.status === 'allocated');
  const confirmed = admissions.filter(a => a.status === 'confirmed');

  return (
    <div>
      <div className="page-header">
        <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Admission Confirmation</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Mark fees as paid and confirm admissions. Admission number is generated only once.
        </p>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {actionMsg && <div className="success-msg">{actionMsg}</div>}

      {/* Rules reminder */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Document must be', value: 'Verified', color: 'var(--success)' },
          { label: 'Fee must be', value: 'Paid', color: 'var(--success)' },
          { label: 'Admission number', value: 'Generated once, immutable', color: 'var(--text-muted)' },
        ].map(r => (
          <div key={r.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '12px',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{r.label}: </span>
            <strong style={{ color: r.color }}>{r.value}</strong>
          </div>
        ))}
      </div>

      {/* Pending confirmations */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title">Pending Confirmation ({allocated.length})</div>
        {allocated.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '1.5rem' }}>
            No pending admissions.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Quota</th>
                  <th>Document</th>
                  <th>Fee Status</th>
                  <th>Mark Fee</th>
                  <th>Confirm</th>
                </tr>
              </thead>
              <tbody>
                {allocated.map(adm => {
                  const blockReason = confirmBlockReason(adm);
                  return (
                    <tr key={adm.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{adm.applicant_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID #{adm.applicant_id}</div>
                      </td>
                      <td>
                        <div>{adm.program_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{adm.course_type}</div>
                      </td>
                      <td><span className="badge badge-blue">{adm.quota_type}</span></td>
                      <td><span className={`badge ${docBadge(adm.document_status)}`}>{adm.document_status}</span></td>
                      <td><span className={`badge ${feeBadge(adm.fee_status)}`}>{adm.fee_status}</span></td>
                      <td>
                        <button
                          className={adm.fee_status === 'Paid' ? 'btn-danger' : 'btn-secondary'}
                          style={{ fontSize: '12px', padding: '3px 10px' }}
                          disabled={loadingFee === adm.id}
                          onClick={() => handleFeeToggle(adm)}
                        >
                          {loadingFee === adm.id ? '…' : adm.fee_status === 'Paid' ? 'Mark Pending' : 'Mark Paid'}
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '12px', padding: '4px 12px' }}
                          disabled={!!blockReason || loadingConfirm === adm.id}
                          title={blockReason || 'Confirm this admission'}
                          onClick={() => handleConfirm(adm)}
                        >
                          {loadingConfirm === adm.id ? 'Confirming…' : blockReason || 'Confirm'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmed admissions */}
      <div className="card">
        <div className="section-title">Confirmed Admissions ({confirmed.length})</div>
        {confirmed.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '1.5rem' }}>
            No confirmed admissions yet.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Program</th>
                  <th>Quota</th>
                  <th>Admission Number</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {confirmed.map(adm => (
                  <tr key={adm.id}>
                    <td style={{ fontWeight: 500 }}>{adm.applicant_name}</td>
                    <td>{adm.program_name} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{adm.course_type}</span></td>
                    <td><span className="badge badge-blue">{adm.quota_type}</span></td>
                    <td>
                      <code style={{
                        background: 'var(--accent-light)', color: 'var(--accent)',
                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                        fontWeight: 600, letterSpacing: '0.02em',
                      }}>
                        {adm.admission_number}
                      </code>
                    </td>
                    <td><span className="badge badge-green">Confirmed</span></td>
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
