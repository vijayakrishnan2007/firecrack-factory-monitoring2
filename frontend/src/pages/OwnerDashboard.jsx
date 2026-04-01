import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { LogOut, Activity, Flame, Wind, AlertTriangle, Droplets } from 'lucide-react';

function OwnerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [factories, setFactories] = useState([]);
  const [selectedFactoryId, setSelectedFactoryId] = useState('');
  
  // History stored globally here for simplicity
  const [history, setHistory] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/factory')
      .then(res => res.json())
      .then(data => {
        const ownerFactories = data.filter(f => f.owner && f.owner._id === user.id);
        if (ownerFactories.length > 0) {
          setFactories(ownerFactories);
          setSelectedFactoryId(ownerFactories[0]._id);
          
          // Seed initial history
          const initialHist = {};
          ownerFactories.forEach(f => {
            initialHist[f._id] = [{
              time: new Date().toLocaleTimeString(),
              temp: f.currentData.temperature,
              gas: f.currentData.gasLevel,
              humidity: f.currentData.humidity
            }];
          });
          setHistory(initialHist);
          
          // Fetch alerts for initially selected
          fetch(`http://localhost:5000/api/factory/${ownerFactories[0]._id}/alerts`)
            .then(res => res.json())
            .then(setAlerts);
        }
      });

    if (socket) {
      socket.on('sensor_update', (updatedFactory) => {
        if (updatedFactory.owner === user.id || (updatedFactory.owner && updatedFactory.owner._id === user.id)) {
          setFactories(prev => {
            const idx = prev.findIndex(f => f._id === updatedFactory._id);
            if(idx >= 0) {
              const newArr = [...prev];
              newArr[idx] = updatedFactory;
              return newArr;
            }
            return [...prev, updatedFactory];
          });
          
          setHistory(prev => {
            const facHist = prev[updatedFactory._id] || [];
            const newHistRow = {
              time: new Date(updatedFactory.currentData.timestamp).toLocaleTimeString(),
              temp: updatedFactory.currentData.temperature,
              gas: updatedFactory.currentData.gasLevel,
              humidity: updatedFactory.currentData.humidity
            };
            const updatedHist = [...facHist, newHistRow];
            return {
              ...prev,
              [updatedFactory._id]: updatedHist.length > 20 ? updatedHist.slice(1) : updatedHist
            };
          });
        }
      });

      socket.on('new_alert', (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 10));
      });
    }

    return () => {
      if (socket) {
        socket.off('sensor_update');
        socket.off('new_alert');
      }
    };
  }, [socket, user.id]);

  const handleFactoryChange = (e) => {
    setSelectedFactoryId(e.target.value);
    fetch(`https://firecrack-factory-monitoring2.onrender.com`)
      .then(res => res.json())
      .then(setAlerts);
  };

  const factory = factories.find(f => f._id === selectedFactoryId);
  if (!factory) return <div className="container">Loading Dashboard...</div>;

  const cd = factory.currentData || {};
  const currentHistory = history[factory._id] || [];

  return (
    <div className="container">
      <div className="nav-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Owner Dashboard</h1>
          <p className="text-muted" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            {factory.location}
            <span style={{ 
              padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', 
              background: cd.isSimulated ? 'var(--warning-glow)' : 'var(--safe-glow)',
              color: cd.isSimulated ? 'var(--warning)' : 'var(--safe)', border: '1px solid currentColor' 
            }}>
              👉 {cd.isSimulated ? 'Simulated Mode Active' : 'Real IoT Mode Active'}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedFactoryId} 
            onChange={handleFactoryChange}
            style={{ width: 'auto', background: 'rgba(0,0,0,0.2)' }}
          >
            {factories.map(f => (
              <option key={f._id} value={f._id}>🏭 {f.name}</option>
            ))}
          </select>

          <button onClick={logout} className="btn-primary" style={{ background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-glass)' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '24px' }}>
        <div className={`glass-panel flex-col gap-2 ${cd.temperature > 40 ? 'animate-pulse-danger glow-danger text-danger' : 'text-safe'}`}>
          <div className="flex justify-between items-center"><span className="text-muted">Temperature</span><Flame size={20} /></div>
          <h2 style={{ fontSize: '2rem' }}>{cd.temperature?.toFixed(1) || 0}°C</h2>
        </div>
        
        <div className={`glass-panel flex-col gap-2 ${cd.humidity > 80 ? 'animate-pulse-danger glow-danger text-danger' : 'text-primary'}`}>
          <div className="flex justify-between items-center"><span className="text-muted">Humidity</span><Droplets size={20} /></div>
          <h2 style={{ fontSize: '2rem' }}>{cd.humidity?.toFixed(1) || 0}%</h2>
        </div>

        <div className={`glass-panel flex-col gap-2 ${cd.gasLevel > 20 ? 'animate-pulse-danger glow-danger text-danger' : cd.gasLevel > 10 ? 'text-warning glow-warning' : 'text-safe'}`}>
          <div className="flex justify-between items-center"><span className="text-muted">Gas Level</span><Wind size={20} /></div>
          <h2 style={{ fontSize: '2rem' }}>{cd.gasLevel?.toFixed(1) || 0}%</h2>
        </div>
        
        <div className={`glass-panel flex-col gap-2 ${factory.safetyScore < 50 ? 'animate-pulse-danger glow-danger text-danger' : factory.safetyScore < 80 ? 'text-warning' : 'text-safe'}`}>
          <div className="flex justify-between items-center"><span className="text-muted">System Health</span><Activity size={20} /></div>
          <h2 style={{ fontSize: '2rem' }}>{factory.safetyScore}%</h2>
        </div>
      </div>

      {/* Split Graphs Section */}
      <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '32px' }}>
        
        {/* Temperature Graph */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 className="flex items-center gap-2" style={{ marginBottom: '16px', color: 'var(--danger)', fontSize: '1rem' }}><Flame size={16} /> Temperature History (°C)</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentHistory}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickMargin={5} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="temp" stroke="var(--danger)" strokeWidth={2} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity Graph */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 className="flex items-center gap-2" style={{ marginBottom: '16px', color: 'var(--primary)', fontSize: '1rem' }}><Droplets size={16} /> Humidity Levels (%)</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentHistory}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickMargin={5} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="humidity" stroke="var(--primary)" strokeWidth={2} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gas Level Graph */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <h3 className="flex items-center gap-2" style={{ marginBottom: '16px', color: 'var(--warning)', fontSize: '1rem' }}><Wind size={16} /> Gas Concentration (%)</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentHistory}>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickMargin={5} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid var(--border-glass)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="gas" stroke="var(--warning)" strokeWidth={2} dot={false} animationDuration={300} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="glass-panel" style={{ background: 'var(--bg-glass)', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <AlertTriangle size={24} className="text-muted" />
        <p className="text-muted" style={{ fontStyle: 'italic', margin: 0 }}>
          This dashboard provides real-time monitoring of environmental conditions inside the factory, helping owners take immediate action to prevent hazardous situations.
        </p>
      </div>

    </div>
  );
}

export default OwnerDashboard;
