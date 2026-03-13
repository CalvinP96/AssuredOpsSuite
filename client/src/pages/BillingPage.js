import React, { useState, useEffect } from 'react';

export default function BillingPage({ role }) {
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billDetail, setBillDetail] = useState(null);

  useEffect(() => {
    fetch('/api/billing').then(r => r.json()).then(setBills).catch(() => {});
  }, []);

  const viewBill = async (bill) => {
    setSelectedBill(bill);
    const res = await fetch(`/api/billing/${bill.id}`);
    setBillDetail(await res.json());
  };

  const updateBillStatus = async (id, status) => {
    await fetch(`/api/billing/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, amount_due: billDetail?.amount_due, notes: billDetail?.notes })
    });
    fetch('/api/billing').then(r => r.json()).then(setBills).catch(() => {});
    setSelectedBill(null);
    setBillDetail(null);
  };

  return (
    <div>
      <div className="section-header">
        <h2>Termination Billing</h2>
      </div>

      <div className="card">
        <h3>All Termination Bills</h3>
        <p style={{ color: '#888', marginBottom: 15 }}>When an employee is terminated, unreturned equipment costs are calculated and a bill is generated.</p>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Employee</th><th>Department</th><th>Bill Date</th><th>Equipment Cost</th><th>Items Unreturned</th><th>Amount Due</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bills.map(bill => (
                <tr key={bill.id}>
                  <td><strong>{bill.first_name} {bill.last_name}</strong></td>
                  <td>{bill.department}</td>
                  <td>{bill.bill_date}</td>
                  <td className="money">${bill.total_equipment_cost?.toFixed(2)}</td>
                  <td>{bill.items_not_returned}</td>
                  <td className="money due">${bill.amount_due?.toFixed(2)}</td>
                  <td><span className={`badge ${bill.status}`}>{bill.status}</span></td>
                  <td><button className="btn btn-sm btn-secondary" onClick={() => viewBill(bill)}>View</button></td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: 'center', color: '#888', padding: 30 }}>No termination bills yet. Bills are auto-generated when HR terminates an employee.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBill && billDetail && (
        <div className="modal-overlay" onClick={() => { setSelectedBill(null); setBillDetail(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Termination Bill: {billDetail.first_name} {billDetail.last_name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              <div><strong>Department:</strong> {billDetail.department}</div>
              <div><strong>Position:</strong> {billDetail.position}</div>
              <div><strong>Hire Date:</strong> {billDetail.hire_date}</div>
              <div><strong>Termination Date:</strong> {billDetail.termination_date}</div>
              <div><strong>Bill Date:</strong> {billDetail.bill_date}</div>
              <div><strong>Status:</strong> <span className={`badge ${billDetail.status}`}>{billDetail.status}</span></div>
            </div>

            <h4 style={{ marginBottom: 10 }}>Equipment Issued</h4>
            <div className="table-container">
              <table>
                <thead><tr><th>Equipment</th><th>Category</th><th>Cost</th><th>Assigned</th><th>Returned</th></tr></thead>
                <tbody>
                  {billDetail.equipment?.map(eq => (
                    <tr key={eq.id}>
                      <td>{eq.equipment_name}</td>
                      <td>{eq.category}</td>
                      <td className="money">${eq.unit_cost?.toFixed(2)}</td>
                      <td>{eq.assigned_date}</td>
                      <td>{eq.returned_date || <span className="badge terminated">Not Returned</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 15, padding: 15, background: '#f8f9fa', borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                Amount Due: <span className="money due">${billDetail.amount_due?.toFixed(2)}</span>
              </div>
            </div>

            {(role === 'Admin' || role === 'Finance') && billDetail.status === 'pending' && (
              <div className="btn-group">
                <button className="btn btn-success" onClick={() => updateBillStatus(billDetail.id, 'paid')}>Mark as Paid</button>
                <button className="btn btn-secondary" onClick={() => updateBillStatus(billDetail.id, 'waived')}>Waive</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
