import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface HistoryEntry {
  id: string;
  timestamp: Date;
  event: string;
  forkliftId?: string;
  zone?: string;
  efficiency?: number;
  duration?: number;
  taskType?: string;
}

interface HistoryDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ isVisible, onClose }) => {
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '4h' | '24h' | '7d'>('4h');

  // Mock history data - in real app this would come from backend/websocket
  useEffect(() => {
    const generateMockHistory = () => {
      const events = [
        'Task Started', 'Task Completed', 'Zone Entered', 'Zone Exited', 
        'Loading Started', 'Loading Completed', 'Unloading Started', 'Unloading Completed',
        'Efficiency Check', 'Route Optimized', 'Alert Triggered', 'Alert Resolved'
      ];
      
      const zones = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'P1', 'P2', 'LOADING', 'UNLOADING'];
      
      const history: HistoryEntry[] = [];
      const now = new Date();
      
      for (let i = 0; i < 100; i++) {
        const timestamp = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        const event = events[Math.floor(Math.random() * events.length)];
        const forkliftId = Math.random() > 0.5 ? 'Forklift-001' : 'Forklift-002';
        const zone = zones[Math.floor(Math.random() * zones.length)];
        
        history.push({
          id: `event-${i}`,
          timestamp,
          event,
          forkliftId,
          zone,
          efficiency: Math.round(45 + Math.random() * 50),
          duration: Math.round(30 + Math.random() * 300),
          taskType: Math.random() > 0.5 ? 'Pick' : 'Put'
        });
      }
      
      return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    };

    setHistoryData(generateMockHistory());
  }, []);

  // Filter data based on selected time range
  const filteredData = historyData.filter(entry => {
    const now = new Date();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    return now.getTime() - entry.timestamp.getTime() <= timeRanges[selectedTimeRange];
  });

  // Prepare chart data
  const hourlyData = React.useMemo(() => {
    const hours: Record<number, { hour: number; tasks: number; efficiency: number; count: number }> = {};
    filteredData.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      if (!hours[hour]) {
        hours[hour] = { hour, tasks: 0, efficiency: 0, count: 0 };
      }
      hours[hour].tasks += 1;
      hours[hour].efficiency += entry.efficiency || 0;
      hours[hour].count += 1;
    });

    return Object.values(hours).map(h => ({
      ...h,
      efficiency: Math.round(h.efficiency / h.count)
    })).sort((a, b) => a.hour - b.hour);
  }, [filteredData]);

  const zoneData = React.useMemo(() => {
    const zones: Record<string, { zone: string; visits: number }> = {};
    filteredData.forEach(entry => {
      if (entry.zone && !entry.zone.startsWith('P')) {
        if (!zones[entry.zone]) {
          zones[entry.zone] = { zone: entry.zone, visits: 0 };
        }
        zones[entry.zone].visits += 1;
      }
    });
    return Object.values(zones);
  }, [filteredData]);

  const forkliftData = React.useMemo(() => {
    const forklifts: Record<string, { name: string; tasks: number; efficiency: number; count: number }> = {};
    filteredData.forEach(entry => {
      if (entry.forkliftId) {
        if (!forklifts[entry.forkliftId]) {
          forklifts[entry.forkliftId] = { 
            name: entry.forkliftId, 
            tasks: 0, 
            efficiency: 0,
            count: 0
          };
        }
        forklifts[entry.forkliftId].tasks += 1;
        forklifts[entry.forkliftId].efficiency += entry.efficiency || 0;
        forklifts[entry.forkliftId].count += 1;
      }
    });

    return Object.values(forklifts).map(f => ({
      ...f,
      efficiency: Math.round(f.efficiency / f.count)
    }));
  }, [filteredData]);

  const COLORS = ['#36BA7C', '#FF4444', '#4A90E2', '#F5A623', '#7B68EE', '#FF6B6B'];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A2235] rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden border border-[#36454F]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#36454F]">
          <div>
            <h2 className="text-2xl font-bold text-white">History Dashboard</h2>
            <p className="text-gray-400 mt-1">Warehouse operations history and analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex bg-[#2D3B5F] rounded-lg p-1">
              {(['1h', '4h', '24h', '7d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-[#36BA7C] text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 h-full overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hourly Activity Chart */}
            <div className="bg-[#2D3B5F] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Hourly Activity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3,3" stroke="#36454F" />
                  <XAxis dataKey="hour" stroke="#FFFFFF" />
                  <YAxis stroke="#FFFFFF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A2235', border: '1px solid #36454F' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="tasks" stroke="#36BA7C" name="Tasks" strokeWidth={2} />
                  <Line type="monotone" dataKey="efficiency" stroke="#4A90E2" name="Avg Efficiency %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Zone Visits Chart */}
            <div className="bg-[#2D3B5F] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Zone Activity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={zoneData}>
                  <CartesianGrid strokeDasharray="3,3" stroke="#36454F" />
                  <XAxis dataKey="zone" stroke="#FFFFFF" />
                  <YAxis stroke="#FFFFFF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A2235', border: '1px solid #36454F' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Bar dataKey="visits" fill="#36BA7C" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Forklift Performance */}
            <div className="bg-[#2D3B5F] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Forklift Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={forkliftData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3,3" stroke="#36454F" />
                  <XAxis type="number" stroke="#FFFFFF" />
                  <YAxis dataKey="name" type="category" stroke="#FFFFFF" width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A2235', border: '1px solid #36454F' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Legend />
                  <Bar dataKey="tasks" fill="#36BA7C" name="Tasks" />
                  <Bar dataKey="efficiency" fill="#4A90E2" name="Efficiency %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Event Distribution */}
            <div className="bg-[#2D3B5F] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Event Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(
                      filteredData.reduce((acc: Record<string, number>, entry) => {
                        acc[entry.event] = (acc[entry.event] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([event, count]) => ({ event, count }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {Object.entries(
                      filteredData.reduce((acc: Record<string, number>, entry) => {
                        acc[entry.event] = (acc[entry.event] || 0) + 1;
                        return acc;
                      }, {})
                    ).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A2235', border: '1px solid #36454F' }}
                    labelStyle={{ color: '#FFFFFF' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Events Table */}
          <div className="bg-[#2D3B5F] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Events</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#36454F]">
                    <th className="text-left text-gray-300 font-medium py-2">Time</th>
                    <th className="text-left text-gray-300 font-medium py-2">Event</th>
                    <th className="text-left text-gray-300 font-medium py-2">Forklift</th>
                    <th className="text-left text-gray-300 font-medium py-2">Zone</th>
                    <th className="text-left text-gray-300 font-medium py-2">Duration</th>
                    <th className="text-left text-gray-300 font-medium py-2">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 20).map(entry => (
                    <tr key={entry.id} className="border-b border-[#36454F]/50 hover:bg-[#1A2235]/50">
                      <td className="py-2 text-gray-300">
                        {entry.timestamp.toLocaleTimeString()}
                      </td>
                      <td className="py-2 text-white font-medium">{entry.event}</td>
                      <td className="py-2 text-gray-300">{entry.forkliftId || '-'}</td>
                      <td className="py-2">
                        <span className="bg-[#36BA7C]/20 text-[#36BA7C] px-2 py-1 rounded text-xs">
                          {entry.zone || '-'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-300">
                        {entry.duration ? `${entry.duration}s` : '-'}
                      </td>
                      <td className="py-2">
                        {entry.efficiency && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            entry.efficiency > 80 
                              ? 'bg-green-500/20 text-green-400'
                              : entry.efficiency > 60
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {entry.efficiency}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryDashboard;
