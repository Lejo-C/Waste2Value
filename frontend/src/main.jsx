import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Cpu, Download, Gauge, Leaf, Menu, Play, RefreshCw, Server, Thermometer, Zap } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './styles.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const fmt = (n, digits = 1) => Number(n ?? 0).toFixed(digits);

function App() {
  const [readings, setReadings] = useState([]);
  const [dispatch, setDispatch] = useState(null);
  const [loadingDispatch, setLoadingDispatch] = useState(false);
  const [mode, setMode] = useState('Simulation');
  const [active, setActive] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(false);

  const latest = readings[readings.length - 1];

  const loadReadings = async () => {
    try {
      const res = await fetch(`${API}/sensors/latest?limit=60`);
      if (!res.ok) throw new Error('sensor request failed');
      setReadings(await res.json());
    } catch {
      // Keep the last rendered state if the API is temporarily unavailable.
    }
  };

  const addSimulation = async () => {
    try {
      await fetch(`${API}/sensors/simulate`, { method: 'POST' });
      await loadReadings();
    } catch {}
  };

  const runDispatch = async () => {
    setLoadingDispatch(true);
    try {
      const res = await fetch(`${API}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horizon_hours: 24, storage_start_kwh: 40, storage_capacity_kwh: 100, heat_pump_capacity_kwh: 25, erf_minimum: 0.10 })
      });
      if (res.ok) setDispatch(await res.json());
    } finally {
      setLoadingDispatch(false);
    }
  };

  useEffect(() => {
    loadReadings();
    runDispatch();
    const timer = setInterval(() => {
      addSimulation();
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const chartData = useMemo(() => readings.map((r, i) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    hot: r.hot_temp,
    cold: r.cold_temp,
    power: r.power_mw,
    load: r.it_load_kw,
    price: r.electricity_price,
  })), [readings]);

  const dispatchData = dispatch?.points ?? [];
  const savingsPct = dispatch?.baseline_cost ? (dispatch.cost_saved / dispatch.baseline_cost) * 100 : 0;

  const nav = [
    ['Overview', Gauge],
    ['Dispatch', BarChart3],
    ['Hardware', Cpu],
    ['Reports', Download],
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">W</div>
          <div><strong>Waste2Value</strong><span>Heat dispatch engine</span></div>
        </div>
        <nav>
          {nav.map(([name, Icon]) => (
            <button key={name} className={`nav-item ${active === name ? 'active' : ''}`} onClick={() => { setActive(name); setMenuOpen(false); }}>
              <Icon size={17} />{name}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection"><span className="dot" /> API connected</div>
          <small>Prototype build · 0.1.0</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(v => !v)}><Menu size={20} /></button>
          <div><p className="eyebrow">DATA CENTER / WASTE HEAT</p><h1>{active}</h1></div>
          <div className="top-actions">
            <div className="mode-switch"><span>Data</span><button className={mode === 'Simulation' ? 'selected' : ''} onClick={() => setMode('Simulation')}>Simulation</button><button className={mode === 'Live ESP32' ? 'selected' : ''} onClick={() => setMode('Live ESP32')}>Live ESP32</button></div>
            <button className="icon-btn" onClick={loadReadings} title="Refresh"><RefreshCw size={17} /></button>
          </div>
        </header>

        {active === 'Overview' && <Overview latest={latest} chartData={chartData} dispatch={dispatch} savingsPct={savingsPct} onRun={runDispatch} loading={loadingDispatch} />}
        {active === 'Dispatch' && <Dispatch dispatch={dispatch} dispatchData={dispatchData} onRun={runDispatch} loading={loadingDispatch} />}
        {active === 'Hardware' && <Hardware latest={latest} readings={readings} />}
        {active === 'Reports' && <Reports dispatch={dispatch} />}
      </main>
    </div>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return <div className="section-head"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>;
}

function Metric({ label, value, unit, note, icon: Icon, accent = false }) {
  return <div className={`metric ${accent ? 'accent' : ''}`}><div className="metric-top"><span>{label}</span><Icon size={17} /></div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-note">{note}</div></div>;
}

function Overview({ latest, chartData, dispatch, savingsPct, onRun, loading }) {
  return <div className="content">
    <div className="status-strip"><div><span className="dot" /> Simulation running</div><span>Last sample {latest ? new Date(latest.timestamp).toLocaleTimeString() : 'waiting for data'}</span></div>
    <section className="metrics-grid">
      <Metric label="PUE" value="1.18" unit="" note="Target < 1.20" icon={Gauge} accent />
      <Metric label="WUE" value="0.45" unit=" L/kWh" note="Current prototype value" icon={Leaf} />
      <Metric label="ERF" value="18" unit="%" note="Minimum model target 10%" icon={ArrowUpRight} />
      <Metric label="Cost saved" value={`₹${fmt(dispatch?.cost_saved, 0)}`} unit="" note={`${fmt(savingsPct, 1)}% vs baseline model`} icon={ArrowDownRight} />
    </section>

    <div className="grid-2">
      <section className="panel chart-panel">
        <SectionTitle eyebrow="LIVE SENSORS" title="Heat profile" action={<span className="live-tag"><span className="dot" /> 2 sec</span>} />
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData}><CartesianGrid stroke="#E4E8E4" vertical={false} /><XAxis dataKey="time" tick={{ fill: '#737A74', fontSize: 11 }} minTickGap={35} /><YAxis tick={{ fill: '#737A74', fontSize: 11 }} /><Tooltip contentStyle={{ border: '1px solid #DDE2DD', borderRadius: 8, boxShadow: '0 8px 24px rgba(59,65,60,.08)' }} /><Line type="monotone" dataKey="hot" name="Hot °C" stroke="#3B413C" strokeWidth={2.2} dot={false} /><Line type="monotone" dataKey="cold" name="Cold °C" stroke="#8FAF9A" strokeWidth={2.2} dot={false} /></ComposedChart></ResponsiveContainer></div>
      </section>
      <section className="panel dispatch-panel">
        <SectionTitle eyebrow="OPTIMIZATION" title="Dispatch plan" action={<button className="primary-btn" onClick={onRun} disabled={loading}>{loading ? 'Running…' : <><Play size={14} /> Run model</>}</button>} />
        <div className="dispatch-summary"><div><span>Released</span><strong>{fmt(dispatch?.total_released)} kWh</strong></div><div><span>Stored</span><strong>{fmt(dispatch?.total_stored)} kWh</strong></div><div><span>Vented</span><strong>{fmt(dispatch?.total_vented)} kWh</strong></div></div>
        <div className="mini-bars">{(dispatch?.points ?? []).slice(0, 12).map((p) => <div key={p.hour} className="mini-bar-group"><div className="mini-bar" style={{ height: `${Math.max(8, p.release * 5)}px` }} /><span>{p.hour}</span></div>)}</div>
        <div className="decision-line"><span>Model decision</span><strong>{(dispatch?.total_released ?? 0) > (dispatch?.total_vented ?? 0) ? 'Prioritize heat recovery' : 'Hold and store heat'}</strong></div>
      </section>
    </div>

    <section className="panel">
      <SectionTitle eyebrow="SYSTEM OUTPUT" title="Current hardware reading" action={<span className="source-label">Source: {latest ? 'PostgreSQL' : 'Waiting'}</span>} />
      <div className="reading-row">
        <Reading icon={Thermometer} label="Hot side" value={latest ? `${fmt(latest.hot_temp, 1)} °C` : '—'} />
        <Reading icon={Thermometer} label="Cold side" value={latest ? `${fmt(latest.cold_temp, 1)} °C` : '—'} />
        <Reading icon={Zap} label="TEG voltage" value={latest ? `${fmt(latest.voltage, 2)} V` : '—'} />
        <Reading icon={Activity} label="TEG power" value={latest ? `${fmt(latest.power_mw, 1)} mW` : '—'} />
        <Reading icon={Server} label="IT load" value={latest ? `${fmt(latest.it_load_kw, 0)} kW` : '—'} />
      </div>
    </section>
  </div>;
}

function Reading({ icon: Icon, label, value }) { return <div className="reading"><Icon size={17} /><span>{label}</span><strong>{value}</strong></div>; }

function Dispatch({ dispatch, dispatchData, onRun, loading }) {
  return <div className="content">
    <section className="panel"><SectionTitle eyebrow="24-HOUR MODEL" title="Dispatch decisions" action={<button className="primary-btn" onClick={onRun} disabled={loading}>{loading ? 'Running…' : <><Play size={14} /> Recalculate</>}</button>} />
      <div className="table-wrap"><table><thead><tr><th>Hour</th><th>Available</th><th>Store</th><th>Release</th><th>Boost</th><th>Vent</th><th>Storage</th><th>Price</th></tr></thead><tbody>{dispatchData.map(p => <tr key={p.hour}><td>{String(p.hour).padStart(2,'0')}:00</td><td>{fmt(p.heat_available)}</td><td>{fmt(p.charge)}</td><td>{fmt(p.release)}</td><td>{fmt(p.boost)}</td><td>{fmt(p.vent)}</td><td>{fmt(p.storage)}</td><td>₹{fmt(p.price,2)}</td></tr>)}</tbody></table></div>
    </section>
    <section className="panel chart-panel tall"><SectionTitle eyebrow="MODEL OUTPUT" title="Heat allocation" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={dispatchData}><CartesianGrid stroke="#E4E8E4" vertical={false}/><XAxis dataKey="hour" tick={{fill:'#737A74',fontSize:11}}/><YAxis tick={{fill:'#737A74',fontSize:11}}/><Tooltip contentStyle={{border:'1px solid #DDE2DD',borderRadius:8}}/><Bar dataKey="charge" stackId="a" fill="#8FAF9A" name="Stored"/><Bar dataKey="release" stackId="a" fill="#3B413C" name="Released"/><Bar dataKey="boost" stackId="a" fill="#B8C9BC" name="Boosted"/><Bar dataKey="vent" stackId="a" fill="#C9CEC9" name="Vented"/></BarChart></ResponsiveContainer></div></section>
    <div className="metrics-grid"><Metric label="Baseline cost" value={`₹${fmt(dispatch?.baseline_cost,0)}`} unit="" note="Without dispatch optimization" icon={ArrowDownRight}/><Metric label="Optimized cost" value={`₹${fmt(dispatch?.optimized_cost,0)}`} unit="" note="Model output" icon={Gauge} accent/><Metric label="CO₂ avoided" value={fmt(dispatch?.carbon_avoided_kg)} unit=" kg" note="Prototype estimate" icon={Leaf}/><Metric label="Heat reused" value={fmt(dispatch?.total_released)} unit=" kWh" note="Released to demand" icon={Activity}/></div>
  </div>;
}

function Hardware({ latest, readings }) {
  return <div className="content"><section className="panel"><SectionTitle eyebrow="ESP32 / SENSOR STREAM" title="Hardware status" action={<span className="live-tag"><span className="dot" /> Connected</span>} /><div className="hardware-grid"><div className="hardware-main"><div className="sensor-hero"><Thermometer size={24}/><div><span>Hot-side temperature</span><strong>{latest ? fmt(latest.hot_temp,1) : '—'} °C</strong></div></div><div className="sensor-grid"><Reading icon={Thermometer} label="Cold side" value={latest ? `${fmt(latest.cold_temp,1)} °C` : '—'} /><Reading icon={Zap} label="Voltage" value={latest ? `${fmt(latest.voltage,2)} V` : '—'} /><Reading icon={Activity} label="Current" value={latest ? `${fmt(latest.current_ma,1)} mA` : '—'} /><Reading icon={Zap} label="Power" value={latest ? `${fmt(latest.power_mw,1)} mW` : '—'} /></div></div><div className="hardware-meta"><div><span>Transport</span><strong>Simulation / HTTP</strong></div><div><span>Sampling</span><strong>2 seconds</strong></div><div><span>Storage</span><strong>PostgreSQL</strong></div><div><span>Recent samples</span><strong>{readings.length}</strong></div></div></div></section></div>;
}

function Reports({ dispatch }) {
  return <div className="content"><section className="report-hero"><div><p className="eyebrow">COMPLIANCE OUTPUT</p><h2>Generate the report from the current dispatch model.</h2><p>Exports the prototype's heat, cost and carbon calculations as a PDF. Use measured site data and your applicable regulatory definitions before production reporting.</p></div><a className="primary-btn link-btn" href={`${API}/report`}><Download size={15}/> Download PDF</a></section><section className="panel"><SectionTitle eyebrow="REPORT CONTENT" title="Included numbers"/><div className="report-list"><div><span>Heat available</span><strong>{fmt(dispatch?.total_heat_available)} kWh</strong></div><div><span>Heat reused</span><strong>{fmt(dispatch?.total_released)} kWh</strong></div><div><span>Cost saved</span><strong>₹{fmt(dispatch?.cost_saved)}</strong></div><div><span>CO₂ avoided</span><strong>{fmt(dispatch?.carbon_avoided_kg)} kg</strong></div><div><span>Baseline cost</span><strong>₹{fmt(dispatch?.baseline_cost)}</strong></div><div><span>Optimized cost</span><strong>₹{fmt(dispatch?.optimized_cost)}</strong></div></div></section></div>;
}

createRoot(document.getElementById('root')).render(<App />);
