import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { ShieldCheck, LogOut, FileText, Check, X, AlertOctagon } from 'lucide-react';

function GovtDashboard() {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [factories, setFactories] = useState([]);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch('https://firecrack-factory-monitoring2.onrender.com/api/factory').then(r => r.json()).then(setFactories);
    fetch('https://firecrack-factory-monitoring2.onrender.com/api/inspection').then(r => r.json()).then(setReports);
    
    // Initial fetch of recent alerts across all factories
    // Simulated via first factory for demo simplicity, or using live sockets

    if (socket) {
      socket.on('sensor_update', (updatedFactory) => {
        setFactories(prev => {
          const idx = prev.findIndex(f => f._id === updatedFactory._id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updatedFactory;
            return next;
          }
          return [...prev, updatedFactory];
        });
      });

      socket.on('new_alert', (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 15));
      });
    }

    return () => {
      if (socket) {
        socket.off('sensor_update');
        socket.off('new_alert');
      }
    };
  }, [socket]);

  const approveReport = async (id) => {
    try {
      const res = await fetch(`https://firecrack-factory-monitoring2.onrender.com/api/inspection/${id}/approve`, { method: 'PUT' });
      if (res.ok) fetch('https://firecrack-factory-monitoring2.onrender.com/api/inspection').then(r => r.json()).then(setReports);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container">
      <div className="nav-header flex justify-between items-center">
        <div>
          <h1 className="flex items-center gap-2" style={{ fontSize: '1.8rem', fontWeight: '700' }}>
            <ShieldCheck className="text-warning" /> Central Authority Dashboard
          </h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Real-time Safety Overview Grid</p>
        </div>
        <button onClick={logout} className="btn-primary" style={{ background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-glass)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Left Col: Master Overview Table */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>Registered Facilities</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px 8px' }}>Factory Base</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px' }}>Live Score</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {factories.map(f => (
                  <tr key={f._id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: '500' }}>{f.name}</td>
                    <td style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>{f.location}</td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ 
                        background: f.safetyScore >= 80 ? 'var(--safe-glow)' : f.safetyScore >= 50 ? 'var(--warning-glow)' : 'var(--danger-glow)',
                        color: f.safetyScore >= 80 ? 'var(--safe)' : f.safetyScore >= 50 ? 'var(--warning)' : 'var(--danger)',
                        padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold'
                      }}>
                        {f.safetyScore}%
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      {f.status === 'Safe' ? <span className="text-safe flex items-center gap-1"><Check size={16}/> Safe</span> : 
                       f.status === 'Warning' ? <span className="text-warning flex items-center gap-1"><AlertOctagon size={16}/> Warning</span> : 
                       <span className="text-danger flex items-center gap-1 animate-pulse-danger"><X size={16}/> Critical</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ margin: '32px 0 16px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>Recent Inspection Approvals</h3>
          <div className="flex-col gap-4">
            {reports.map(r => (
              <div key={r._id} style={{ padding: '16px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-glass)' }} className="flex justify-between items-center">
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                    <FileText size={18} className="text-primary"/> {r.factoryId?.name || 'Unknown Factory'}
                  </h4>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                    Status: <span style={{ color: r.status === 'Compliant' ? 'var(--safe)' : 'var(--danger)' }}>{r.status}</span> • 
                    Date: {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '8px' }}>"{r.remarks}"</p>
                </div>
                <div>
                  {r.approved ? (
                    <span className="text-safe flex items-center gap-1"><Check size={18}/> Processed</span>
                  ) : (
                    <button onClick={() => approveReport(r._id)} className="btn-primary text-sm">Review & Approve</button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Col: Live Global Incident Stream */}
        <div className="glass-panel flex-col" style={{ borderLeft: '3px solid var(--warning)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--warning)' }}>Live Incident Stream</h3>
          <div className="flex-col gap-3" style={{ overflowY: 'auto' }}>
            {alerts.length === 0 ? <p className="text-muted">Global operations stable. No incidents.</p> : alerts.map((a, i) => (
              <div key={i} style={{ 
                padding: '12px', borderRadius: '8px', 
                background: a.severity === 'Danger' ? 'var(--danger-glow)' : 'var(--bg-glass)',
                border: `1px solid ${a.severity === 'Danger' ? 'var(--danger)' : 'var(--border-glass)'}`
              }}>
                <div className="flex justify-between items-center text-muted" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span>{new Date(a.createdAt || Date.now()).toLocaleTimeString()}</span>
                  <span style={{ color: a.severity === 'Danger' ? 'var(--danger)' : 'var(--warning)', fontWeight: 'bold' }}>{a.severity.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: '0.95rem', color: '#f8fafc', fontWeight: 500 }}>{a.message}</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>Network Alert ID: {a._id || Math.random().toString(36).substring(7)}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="glass-panel" style={{ marginTop: '24px', background: 'var(--bg-glass)', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <ShieldCheck size={24} className="text-muted" />
        <p className="text-muted" style={{ fontStyle: 'italic', margin: 0 }}>
          This centralized dashboard allows authorities to monitor all registered factories, track safety compliance, and take action based on real-time data and inspection reports.
        </p>
      </div>

    </div>
  );
}

export default GovtDashboard;
