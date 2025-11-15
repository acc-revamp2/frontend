import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DeviceType {
  id: number;
  typeName: string;
  logo: string;
}

interface WidgetType {
  id: string;
  name: string;
  componentName: string;
  defaultConfig: any;
  displayName?: string;
}

interface Property {
  id: number;
  name: string;
  tag: string;
  dataType: string;
  unit: string;
  order: number;
}

interface Device {
  deviceId?: number;
  id?: number;
  deviceSerial?: string;
  serial_number?: string;
  deviceName?: string;
  type?: string;
}

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const dummyData = [
  { time: '14:25:38', s1: 4000, s2: 2400, s3: 2400 },
  { time: '14:29:38', s1: 3000, s2: 1398, s3: 2210 },
  { time: '14:35:32', s1: 2000, s2: 9800, s3: 2290 },
  { time: '14:39:12', s1: 2780, s2: 3908, s3: 2000 },
  { time: '14:53:54', s1: 1890, s2: 4800, s3: 2181 },
  { time: '14:55:44', s1: 2390, s2: 3800, s3: 2500 },
];

const COLORS = ['#7B61FF', '#4FC3F7', '#EC4899', '#10B981', '#F59E0B'];

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState<'line' | 'scatter' | 'area' | 'bar' | 'pie'>('line');
  const [showGrid, setShowGrid] = useState(true);
  const [showDots, setShowDots] = useState(true);

  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [widgetTypes, setWidgetTypes] = useState<WidgetType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  const [selectedDeviceType, setSelectedDeviceType] = useState<number | null>(null);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null);
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [numSeries, setNumSeries] = useState(1);
  const [widgetName, setWidgetName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDeviceTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDeviceType) {
      loadAvailableWidgets();
    }
  }, [selectedDeviceType]);

  const loadDeviceTypes = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:5000/api/widgets/device-types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setDeviceTypes(result.data);
      }
    } catch (err) {
      console.error('Failed to load device types:', err);
      setError('Failed to load device types');
    }
  };

  const loadAvailableWidgets = async () => {
    if (!token || !selectedDeviceType) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/widgets/available-widgets?deviceTypeId=${selectedDeviceType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setWidgetTypes(result.data.widgetTypes);
        setProperties(result.data.properties);
        setError('');
      }
    } catch (err) {
      console.error('Failed to load available widgets:', err);
      setError('Failed to load widget options');
    } finally {
      setLoading(false);
    }
  };

  const loadDevicesByType = async () => {
    if (!token || !selectedDeviceType) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/widgets/devices?deviceTypeId=${selectedDeviceType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setDevices(result.data);
      }
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const handlePropertySelect = (index: number, propertyId: number | null) => {
    const newProperties = [...selectedProperties];
    if (propertyId !== null) {
      newProperties[index] = propertyId;
    }
    setSelectedProperties(newProperties);
  };

  const handleCreateWidget = async () => {
    if (!token || !selectedDeviceType || !selectedWidgetType || selectedProperties.length === 0) {
      setError('Please complete all steps');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/widgets/create-widget', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceTypeId: selectedDeviceType,
          widgetTypeId: selectedWidgetType,
          propertyIds: selectedProperties,
          displayName: widgetName || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess();
        handleClose();
      } else {
        setError(result.message || 'Failed to create widget');
      }
    } catch (err) {
      console.error('Failed to create widget:', err);
      setError('Failed to create widget');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedDeviceType(null);
    setSelectedWidgetType(null);
    setSelectedProperties([]);
    setSelectedDevice(null);
    setNumSeries(1);
    setWidgetName('');
    setError('');
    setChartType('line');
    onClose();
  };

  const handleNextStep = () => {
    if (step === 1 && selectedDeviceType) {
      setStep(2);
      setError('');
    } else if (step === 2 && selectedWidgetType) {
      setStep(3);
      loadDevicesByType();
      setSelectedProperties(Array(numSeries).fill(null));
      setError('');
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    }
  };

  const canProceedToNext = () => {
    if (step === 1) return selectedDeviceType !== null;
    if (step === 2) return selectedWidgetType !== null;
    if (step === 3) return selectedDevice !== null && selectedProperties.every(p => p !== null);
    return false;
  };

  if (!isOpen) return null;

  const bg = theme === 'dark' ? 'bg-[#0b1326] text-white' : 'bg-white text-gray-900';
  const border = theme === 'dark' ? 'border-white/10' : 'border-gray-300';
  const cardBg = theme === 'dark' ? 'bg-[#162345] hover:bg-[#1a2e52]' : 'bg-gray-50 hover:bg-gray-100';
  const selectedCardBg = theme === 'dark' ? 'bg-[#6656F5] ring-2 ring-[#7B61FF]' : 'bg-blue-50 ring-2 ring-blue-500';

  const renderDeviceTypeSelection = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-4 opacity-90">Select Device Type</h3>
        {deviceTypes.length === 0 ? (
          <div className={`p-4 rounded-lg text-sm text-center opacity-50`}>
            No device types available
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {deviceTypes.map((dt) => (
              <button
                key={dt.id}
                onClick={() => setSelectedDeviceType(dt.id)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedDeviceType === dt.id
                    ? selectedCardBg
                    : `${cardBg} ${border}`
                }`}
              >
                <img src={dt.logo} alt={dt.typeName} className="w-8 h-8 mx-auto mb-2 object-contain" />
                <div className="text-xs font-medium text-center truncate">{dt.typeName}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWidgetTypeSelection = () => {
    const lineCharts = widgetTypes.filter(w => w.name.toLowerCase().includes('line') || w.componentName === 'CustomLineChart');
    const metricsCards = widgetTypes.filter(w => w.componentName === 'MetricsCard');
    const otherWidgets = widgetTypes.filter(w => !lineCharts.includes(w) && !metricsCards.includes(w));

    return (
      <div className="space-y-6">
        {lineCharts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 opacity-90">Line Charts</h3>
            <div className="flex flex-wrap gap-2">
              {lineCharts.map((wt) => (
                <button
                  key={wt.id}
                  onClick={() => {
                    setSelectedWidgetType(wt.id);
                    setChartType('line');
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedWidgetType === wt.id
                      ? 'bg-[#6656F5] text-white border-[#7B61FF]'
                      : `${cardBg} ${border}`
                  }`}
                >
                  {wt.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {metricsCards.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 opacity-90">Metrics Cards</h3>
            <div className="flex flex-wrap gap-2">
              {metricsCards.map((wt) => (
                <button
                  key={wt.id}
                  onClick={() => setSelectedWidgetType(wt.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedWidgetType === wt.id
                      ? 'bg-[#6656F5] text-white border-[#7B61FF]'
                      : `${cardBg} ${border}`
                  }`}
                >
                  {wt.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {otherWidgets.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 opacity-90">Other Widgets</h3>
            <div className="flex flex-wrap gap-2">
              {otherWidgets.map((wt) => (
                <button
                  key={wt.id}
                  onClick={() => setSelectedWidgetType(wt.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedWidgetType === wt.id
                      ? 'bg-[#6656F5] text-white border-[#7B61FF]'
                      : `${cardBg} ${border}`
                  }`}
                >
                  {wt.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSeriesConfiguration = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 opacity-90">Select Device</label>
          <select
            value={selectedDevice || ''}
            onChange={(e) => setSelectedDevice(Number(e.target.value) || null)}
            className={`w-full px-3 py-2 rounded-lg border ${border} bg-transparent text-sm`}
          >
            <option value="">Choose a device...</option>
            {devices.map((d) => (
              <option key={d.deviceId || d.id} value={d.deviceId || d.id}>
                {d.deviceSerial || d.serial_number}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 opacity-90">Number of Series</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNumSeries(Math.max(1, numSeries - 1))}
              className={`p-2 rounded-lg border ${border} hover:bg-white/5 transition`}
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className={`flex-1 text-center py-2 rounded-lg border ${border} font-medium`}>
              {numSeries}
            </div>
            <button
              onClick={() => setNumSeries(Math.min(5, numSeries + 1))}
              className={`p-2 rounded-lg border ${border} hover:bg-white/5 transition`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3 opacity-90">Select Properties for Each Series</label>
        <div className="space-y-2">
          {Array.from({ length: numSeries }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs font-medium min-w-[60px] opacity-70">Series {index + 1}</span>
              <select
                value={selectedProperties[index] || ''}
                onChange={(e) => handlePropertySelect(index, Number(e.target.value) || null)}
                className={`flex-1 px-3 py-2 rounded-lg border ${border} bg-transparent text-sm`}
              >
                <option value="">Choose property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.unit})
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {selectedWidgetType && widgetTypes.find(w => w.id === selectedWidgetType)?.componentName === 'CustomLineChart' && (
        <div>
          <label className="block text-sm font-medium mb-3 opacity-90">Chart Options</label>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={() => setShowGrid(!showGrid)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Show Grid</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDots}
                onChange={() => setShowDots(!showDots)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Show Dots</span>
            </label>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2 opacity-90">Widget Name (Optional)</label>
        <input
          type="text"
          value={widgetName}
          onChange={(e) => setWidgetName(e.target.value)}
          placeholder="e.g., Main Production Chart"
          className={`w-full px-3 py-2 rounded-lg border ${border} bg-transparent text-sm`}
        />
      </div>

      <div
        className={`rounded-lg border ${border} p-4 overflow-hidden`}
        style={{ height: 250 }}
      >
        <h3 className="text-xs mb-2 font-medium opacity-80">Preview</h3>
        <ResponsiveContainer width="100%" height="100%">
          {renderPreview()}
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPreview = () => {
    switch (chartType) {
      case 'scatter':
        return (
          <ScatterChart data={dummyData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Scatter name="Series 1" data={dummyData} fill={COLORS[0]} />
            <Scatter name="Series 2" data={dummyData} fill={COLORS[1]} />
            <Scatter name="Series 3" data={dummyData} fill={COLORS[2]} />
          </ScatterChart>
        );
      case 'area':
        return (
          <AreaChart data={dummyData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="s1"
              stackId="1"
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="s2"
              stackId="1"
              stroke={COLORS[1]}
              fill={COLORS[1]}
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="s3"
              stackId="1"
              stroke={COLORS[2]}
              fill={COLORS[2]}
              fillOpacity={0.5}
            />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart data={dummyData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="s1" fill={COLORS[0]} />
            <Bar dataKey="s2" fill={COLORS[1]} />
            <Bar dataKey="s3" fill={COLORS[2]} />
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Tooltip />
            <Pie data={dummyData} dataKey="s1" nameKey="time" outerRadius={100}>
              {dummyData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        );
      default:
        return (
          <LineChart data={dummyData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="s1"
              stroke={COLORS[0]}
              dot={showDots}
            />
            <Line
              type="monotone"
              dataKey="s2"
              stroke={COLORS[1]}
              dot={showDots}
            />
            <Line
              type="monotone"
              dataKey="s3"
              stroke={COLORS[2]}
              dot={showDots}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl border ${border} ${bg} p-6 relative`}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Create Widget</h2>
            <p className="text-xs opacity-60 mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all ${
                s <= step ? 'bg-[#6656F5]' : theme === 'dark' ? 'bg-white/10' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="min-h-[300px] mb-6">
          {step === 1 && renderDeviceTypeSelection()}
          {step === 2 && renderWidgetTypeSelection()}
          {step === 3 && renderSeriesConfiguration()}
        </div>

        <div className="flex gap-3 justify-between">
          <button
            onClick={handleClose}
            className={`rounded-lg px-6 py-2 font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={handlePreviousStep}
                className={`rounded-lg px-6 py-2 font-medium transition-colors flex items-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-[#162345] text-white hover:bg-[#1a2e52]'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={!canProceedToNext() || loading}
                className={`rounded-lg px-6 py-2 font-medium transition-colors flex items-center gap-2 ${
                  !canProceedToNext() || loading
                    ? 'cursor-not-allowed opacity-50'
                    : 'bg-[#6656F5] text-white hover:bg-[#5646d4]'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreateWidget}
                disabled={!canProceedToNext() || loading}
                className={`rounded-lg px-6 py-2 font-medium transition-colors ${
                  !canProceedToNext() || loading
                    ? 'cursor-not-allowed opacity-50'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Creating...' : 'Create Widget'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddWidgetModal;
