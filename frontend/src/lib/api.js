const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Programs
  getPrograms: () => apiFetch('/programs'),
  createProgram: (body) => apiFetch('/programs', { method: 'POST', body: JSON.stringify(body) }),
  getProgramQuotas: (id) => apiFetch(`/programs/${id}/quotas`),

  // Applicants
  getApplicants: () => apiFetch('/applicants'),
  getUnallocated: () => apiFetch('/applicants/unallocated'),
  createApplicant: (body) => apiFetch('/applicants', { method: 'POST', body: JSON.stringify(body) }),
  updateDocumentStatus: (id, status) =>
    apiFetch(`/applicants/${id}/document-status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Admissions
  getAdmissions: () => apiFetch('/admissions'),
  allocateSeat: (body) => apiFetch('/admissions/allocate', { method: 'POST', body: JSON.stringify(body) }),
  updateFeeStatus: (id, fee_status) =>
    apiFetch(`/admissions/${id}/fee-status`, { method: 'PATCH', body: JSON.stringify({ fee_status }) }),
  confirmAdmission: (id) => apiFetch(`/admissions/${id}/confirm`, { method: 'POST' }),

  // Dashboard
  getDashboard: () => apiFetch('/dashboard'),
};
