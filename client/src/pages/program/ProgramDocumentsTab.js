import React, { useState } from 'react';
import * as api from '../../api';

const DOC_TYPES = ['Policy', 'Procedure', 'Form', 'Report', 'Audit', 'Compliance', 'Training', 'SOP', 'Manual', 'Checklist', 'Other'];
const DOC_STATUSES = ['draft', 'in_review', 'approved', 'active', 'archived'];

export default function ProgramDocumentsTab({ program, canEdit, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [form, setForm] = useState({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' });

  const closeModal = () => { setShowModal(false); setEditDoc(null); setForm({ title: '', doc_type: 'SOP', assigned_to: '', due_date: '', notes: '' }); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editDoc) {
        await api.updateDocument(editDoc.id, { ...editDoc, ...form });
      } else {
        await api.createDocument(program.id, form);
      }
      closeModal();
      onRefresh();
    } catch (err) { alert('Failed to save document: ' + err.message); }
  };

  const updateStatus = async (doc, status) => {
    try { await api.updateDocument(doc.id, { ...doc, status }); onRefresh(); }
    catch (err) { alert('Failed to update document: ' + err.message); }
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try { await api.deleteDocument(docId); onRefresh(); }
    catch (err) { alert('Failed to delete document: ' + err.message); }
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setForm({ title: doc.title, doc_type: doc.doc_type, assigned_to: doc.assigned_to || '', due_date: doc.due_date || '', notes: doc.notes || '' });
    setShowModal(true);
  };

  return (
    <div>
      {canEdit && (
        <div style={{ marginBottom: 15 }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Document</button>
        </div>
      )}
      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Version</th><th>Assigned To</th><th>Due Date</th><th>Actions</th></tr></thead>
            <tbody>
              {program.documents?.map(doc => (
                <tr key={doc.id}>
                  <td><strong>{doc.title}</strong></td>
                  <td>{doc.doc_type}</td>
                  <td>
                    {canEdit ? (
                      <select className="btn btn-sm" value={doc.status} onChange={e => updateStatus(doc, e.target.value)}
                        style={{ padding: '2px 6px', fontSize: 12 }}>
                        {DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <span className={`badge ${doc.status === 'approved' || doc.status === 'active' ? 'active' : doc.status === 'draft' ? 'pending' : 'at_risk'}`}>{doc.status}</span>
                    )}
                  </td>
                  <td>{doc.version}</td>
                  <td>{doc.assigned_to || '-'}</td>
                  <td>{doc.due_date || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {canEdit && <button className="btn btn-sm btn-secondary" onClick={() => openEdit(doc)}>Edit</button>}
                      {canEdit && <button className="btn btn-sm btn-danger" onClick={() => deleteDoc(doc.id)}>Del</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {(!program.documents || program.documents.length === 0) && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No documents yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editDoc ? 'Edit Document' : 'Add Document'}</h3>
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Document Title *</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select value={form.doc_type} onChange={e => setForm({...form, doc_type: e.target.value})}>
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <input value={form.assigned_to} onChange={e => setForm({...form, assigned_to: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-success">{editDoc ? 'Update' : 'Add Document'}</button>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
