import React, { useState, useEffect } from 'react';
import { 
  Activity, TrendingUp, AlertTriangle, Package, GitBranch, 
  Download, Mail, RefreshCw, BarChart3, PieChart, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';
import toast from 'react-hot-toast';
import { analyticsAPI, nodeAPI, routeAPI, reportAPI, emailAPI } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [networkHealth, setNetworkHealth] = useState(null);
  const [nodeStats, setNodeStats] = useState(null);
  const [routeStats, setRouteStats] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [autoAlertsEnabled, setAutoAlertsEnabled] = useState(false);
  const [alertFrequency, setAlertFrequency] = useState('hourly');

  useEffect(() => {
    fetchDashboardData();
    fetchAlertStatus();
  }, []);

  const fetchAlertStatus = async () => {
    try {
      const response = await emailAPI.getAlertStatus();
      setAutoAlertsEnabled(response.data.enabled);
      setAlertFrequency(response.data.frequency);
    } catch (error) {
      // User might not be logged in, ignore error
      console.log('Could not fetch alert status');
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, healthRes, nodeStatsRes, routeStatsRes] = await Promise.all([
        analyticsAPI.getMetrics().catch(() => ({ data: null })),
        analyticsAPI.getNetworkHealth().catch(() => ({ data: null })),
        nodeAPI.getStats().catch(() => ({ data: null })),
        routeAPI.getStats().catch(() => ({ data: null })),
      ]);

      setMetrics(metricsRes.data);
      setNetworkHealth(healthRes.data);
      setNodeStats(nodeStatsRes.data);
      setRouteStats(routeStatsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      toast.loading('Generating PDF report...');
      const response = await reportAPI.generatePDF();
      toast.dismiss();
      toast.success('PDF report generated!');
      
      // Download the file
      window.open(reportAPI.download(response.data.filename), '_blank');
    } catch (error) {
      toast.dismiss();
      console.error('Error generating PDF:', error);
      toast.error(error.response?.data?.message || 'Failed to generate PDF');
    }
  };

  const handleGenerateExcel = async () => {
    try {
      toast.loading('Generating Excel report...');
      const response = await reportAPI.generateExcel();
      toast.dismiss();
      toast.success('Excel report generated!');
      
      // Download the file
      window.open(reportAPI.download(response.data.filename), '_blank');
    } catch (error) {
      toast.dismiss();
      console.error('Error generating Excel:', error);
      toast.error(error.response?.data?.message || 'Failed to generate Excel');
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error('Please enter an email address');
      return;
    }

    setSendingEmail(true);
    try {
      await emailAPI.sendReport({
        email: emailAddress,
        includePDF: true,
        includeExcel: true
      });
      toast.success(`Report sent to ${emailAddress}`);
      setEmailModalOpen(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendAlert = async () => {
    try {
      toast.loading('Sending risk alert...');
      const response = await emailAPI.sendAlert();
      toast.dismiss();
      
      if (response.data.alertsSent) {
        const summary = response.data.summary;
        toast.success(
          `Alert sent! ${summary.disruptedNodes + summary.disruptedRoutes + summary.highRiskRoutes + summary.bottlenecks} issues detected`,
          { duration: 5000 }
        );
      } else {
        toast.success('No alerts to send. Network is healthy!');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error sending alert:', error);
      toast.error(error.response?.data?.message || 'Failed to send alert');
    }
  };

  const handleToggleAutoAlerts = async () => {
    try {
      if (autoAlertsEnabled) {
        await emailAPI.disableAutoAlerts();
        setAutoAlertsEnabled(false);
        toast.success('Automatic alerts disabled');
      } else {
        const response = await emailAPI.enableAutoAlerts({ frequency: alertFrequency });
        setAutoAlertsEnabled(true);
        toast.success(`Automatic alerts enabled (${response.data.description})`);
      }
    } catch (error) {
      console.error('Error toggling auto alerts:', error);
      toast.error(error.response?.data?.message || 'Failed to toggle automatic alerts');
    }
  };

  const handleFrequencyChange = async (newFrequency) => {
    setAlertFrequency(newFrequency);
    if (autoAlertsEnabled) {
      try {
        const response = await emailAPI.enableAutoAlerts({ frequency: newFrequency });
        toast.success(`Frequency updated (${response.data.description})`);
      } catch (error) {
        console.error('Error updating frequency:', error);
        toast.error('Failed to update frequency');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics || !networkHealth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600 mb-6">Please upload nodes and routes data to view analytics</p>
          <a
            href="/upload"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Upload Data</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Prepare chart data
  const nodeTypeData = nodeStats?.byType?.map(item => ({
    name: item._id || 'Unknown',
    value: item.count
  })) || [];

  const routeStatusData = routeStats?.byStatus?.map(item => ({
    name: item._id || 'Unknown',
    value: item.count
  })) || [];

  const topCriticalNodes = (metrics?.criticalNodes && metrics.criticalNodes.length > 0)
    ? metrics.criticalNodes.slice(0, 5).map(node => ({
        name: node.nodeId,
        score: (node.criticalityScore * 100).toFixed(1)
      }))
    : [];

  const topBottlenecks = (metrics?.bottlenecks && metrics.bottlenecks.length > 0)
    ? metrics.bottlenecks.slice(0, 5).map(node => ({
        name: node.nodeId,
        score: (node.normalizedScore * 100).toFixed(1)
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Supply Chain Dashboard</h1>
            <p className="text-gray-600">Real-time network analysis and insights</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <button
              onClick={fetchDashboardData}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleGeneratePDF}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            <button
              onClick={handleGenerateExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
            <button
              onClick={handleSendAlert}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Send Alert</span>
            </button>
          </div>
        </div>

        {/* Health Score */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2 opacity-90">Network Health Score</h2>
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl font-bold">{networkHealth.healthScore}</span>
                <span className="text-3xl opacity-75">/100</span>
              </div>
              <p className="mt-2 text-lg opacity-90">{networkHealth.healthStatus}</p>
            </div>
            <Activity className="w-24 h-24 opacity-20" />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Nodes"
            value={networkHealth.summary.totalNodes}
            icon={Package}
            color="blue"
            subtitle={`${networkHealth.summary.activeNodes} active`}
          />
          <MetricCard
            title="Total Routes"
            value={networkHealth.summary.totalRoutes}
            icon={GitBranch}
            color="purple"
            subtitle={`${networkHealth.summary.activeRoutes} active`}
          />
          <MetricCard
            title="Critical Nodes"
            value={networkHealth.summary.criticalNodes}
            icon={AlertTriangle}
            color="red"
            subtitle="High importance"
          />
          <MetricCard
            title="Bottlenecks"
            value={networkHealth.summary.bottlenecks}
            icon={TrendingUp}
            color="orange"
            subtitle="Potential risks"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Node Types Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Node Types Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={nodeTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {nodeTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          {/* Route Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Route Status</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={routeStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Critical Nodes */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Top Critical Nodes</h3>
            </div>
            {topCriticalNodes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCriticalNodes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No critical nodes detected</p>
                  <p className="text-xs mt-1">All nodes have low criticality scores</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottlenecks */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Top Bottleneck Nodes</h3>
            </div>
            {topBottlenecks.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topBottlenecks} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No bottleneck nodes detected</p>
                  <p className="text-xs mt-1">Network flow is well distributed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-3">
            {networkHealth.recommendations?.map((rec, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'critical' ? 'bg-red-50 border-red-500' :
                  rec.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        rec.priority === 'critical' ? 'bg-red-200 text-red-800' :
                        rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <h4 className="font-semibold text-gray-900">{rec.issue}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <p className="text-sm font-medium text-gray-900">
                      <strong>Action:</strong> {rec.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Automatic Alerts Settings */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Automatic Risk Alerts</h3>
              <p className="text-sm text-gray-600">Get notified automatically when risks are detected</p>
            </div>
            <button
              onClick={handleToggleAutoAlerts}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                autoAlertsEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  autoAlertsEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {autoAlertsEnabled && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">Monitoring Active</span>
              </div>
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700">Check Frequency:</label>
                <select
                  value={alertFrequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="15min">Every 15 minutes</option>
                  <option value="30min">Every 30 minutes</option>
                  <option value="hourly">Every hour</option>
                  <option value="6hours">Every 6 hours</option>
                  <option value="daily">Daily at 9 AM</option>
                </select>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                ✉️ Alerts will be sent to your registered email when risks are detected
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Send Report via Email</h3>
            <p className="text-gray-600 mb-4">Enter email address to receive the analysis report</p>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {sendingEmail ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
};

export default Dashboard;
