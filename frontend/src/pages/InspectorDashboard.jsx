import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ClipboardCheck, Calendar, LogOut, CheckCircle, XCircle } from 'lucide-react';

function InspectorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  
  const [form, setForm] = useState({
    safetyConditions: false,
    fireExtinguishers: false,
    ventilation: false,
    workerGear: false,
    remarks: '',
    status: 'Compliant'
  });

  useEffect(() => {
    fetch(`http://localhost:5000/api/factory?inspectorId=${user.id}`)
      .then(res => res.json())
      .then(setFactories);
  }, [user.id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev, [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFactory) return alert('Select a factory first');
    
    try {
      const res = await fetch('http://localhost:5000/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factoryId: selectedFactory._id,
          inspectorId: user.id,
          checklist: {
            safetyConditions: form.safetyConditions,
            fireExtinguishers: form.fireExtinguishers,
            ventilation: form.ventilation,
            workerGear: form.workerGear
          },
          remarks: form.remarks,
          status: form.status
        })
      });

      if (res.ok) {
        alert('Inspection Report Submitted Successfully');
        // Refresh 
        fetch(`http://localhost:5000/api/factory?inspectorId=${user.id}`).then(r => r.json()).then(setFactories);
        setSelectedFactory(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit report');
    }
  };

  return (
    <div className="container">
      <div className="nav-header flex justify-between items-center">
        <div>
          <h1 className="flex items-center gap-2" style={{ fontSize: '1.8rem', fontWeight: '700' }}><ClipboardCheck className="text-primary" /> Inspector Portal</h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Welcome back, {user.name}</p>
        </div>
        <button onClick={logout} className="btn-primary" style={{ background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-glass)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Factory List */}
        <div className="glass-panel text-muted" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>Assigned Factories</h3>
          {factories.map(f => (
            <div 
              key={f._id} 
              onClick={() => setSelectedFactory(f)}
              style={{ padding: '16px', background: selectedFactory?._id === f._id ? 'var(--primary-hover)' : 'var(--bg-glass)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border-glass)' }}
            >
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px' }}>{f.name}</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}><Calendar size={14} /> Next Due: {new Date(f.nextInspectionDate).toLocaleDateString()}</p>
            </div>
          ))}
        </div>

        {/* Right Column: Inspection Form */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          {!selectedFactory ? (
            <div className="flex justify-center items-center h-full text-muted" style={{ height: '300px' }}>
              Select a factory from the list to begin an inspection report.
            </div>
          ) : (
            <div>
              <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Create Report: <span className="text-primary">{selectedFactory.name}</span>
              </h2>
              <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.9rem' }}>Location: {selectedFactory.location} • Last Inspected: {new Date(selectedFactory.lastInspectionDate).toLocaleDateString()}</p>
              
              <form onSubmit={handleSubmit} className="flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center justify-between" style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <span>General Safety Conditions</span>
                    <input type="checkbox" name="safetyConditions" checked={form.safetyConditions} onChange={handleChange} style={{ width: 'auto', transform: 'scale(1.2)' }} />
                  </label>
                  <label className="flex items-center justify-between" style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <span>Functional Fire Extinguishers</span>
                    <input type="checkbox" name="fireExtinguishers" checked={form.fireExtinguishers} onChange={handleChange} style={{ width: 'auto', transform: 'scale(1.2)' }} />
                  </label>
                  <label className="flex items-center justify-between" style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <span>High-Grade Ventilation System</span>
                    <input type="checkbox" name="ventilation" checked={form.ventilation} onChange={handleChange} style={{ width: 'auto', transform: 'scale(1.2)' }} />
                  </label>
                  <label className="flex items-center justify-between" style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <span>Worker Protection Gear</span>
                    <input type="checkbox" name="workerGear" checked={form.workerGear} onChange={handleChange} style={{ width: 'auto', transform: 'scale(1.2)' }} />
                  </label>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Inspector Remarks</label>
                  <textarea name="remarks" rows="4" value={form.remarks} onChange={handleChange} placeholder="Record overall evaluation and specific violations..." style={{ resize: 'none' }} required></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4" style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Compliance Assessment</label>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Final Action</label>
                  
                  <select name="status" value={form.status} onChange={handleChange} style={{ color: form.status === 'Compliant' ? 'var(--safe)' : 'var(--danger)', fontWeight: 'bold' }}>
                    <option value="Compliant">✓ Compliant (Safe)</option>
                    <option value="Violation">✗ Violation Detected (Danger)</option>
                  </select>

                  <button className={`btn-primary flex items-center justify-center gap-2 ${form.status === 'Violation' ? 'bg-danger' : 'bg-safe'}`} type="submit">
                     {form.status === 'Violation' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                     Submit Report
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '24px', background: 'var(--bg-glass)', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <ClipboardCheck size={24} className="text-muted" />
        <p className="text-muted" style={{ fontStyle: 'italic', margin: 0 }}>
          This portal enables inspectors to perform periodic safety audits, submit reports, and ensure compliance with regulatory standards.
        </p>
      </div>

    </div>
  );
}

export default InspectorDashboard;
