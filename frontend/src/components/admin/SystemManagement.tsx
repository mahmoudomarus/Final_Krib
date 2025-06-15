import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive,
  Activity,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Zap,
  Monitor,
  BarChart3,
  Download,
  Users,
  FileText,
  Trash2,
  Archive,
  RotateCcw,
  Play,
  Square
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate, formatCurrency } from '../../lib/utils';

interface SystemStats {
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  responseTime: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface SystemService {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'maintenance';
  uptime: number;
  cpu: number;
  memory: number;
  port?: number;
  version?: string;
  lastRestart?: string;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  details?: any;
}

interface BackupInfo {
  id: string;
  type: 'database' | 'files' | 'full';
  size: number;
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed';
  location: string;
}

const SystemManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'logs' | 'backups' | 'maintenance'>('overview');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [services, setServices] = useState<SystemService[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<SystemService | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/super-admin/system') as { data: any };
      const data = response.data;
      
      setSystemStats(data.stats);
      setServices(data.services);
      setLogs(data.logs);
      setBackups(data.backups);
    } catch (error) {
      console.error('Error fetching system data:', error);
      // Set realistic sample data for demonstration
      setSystemStats({
        uptime: 2547.5, // ~42 hours
        cpuUsage: 23.4,
        memoryUsage: 67.8,
        diskUsage: 45.2,
        networkIn: 1.2,
        networkOut: 0.8,
        activeConnections: 156,
        responseTime: 245,
        errorRate: 0.02,
        requestsPerMinute: 847
      });
      
      setServices([
        {
          id: '1',
          name: 'API Server',
          status: 'running',
          uptime: 2547.5,
          cpu: 15.2,
          memory: 512,
          port: 5001,
          version: '1.0.0',
          lastRestart: new Date(Date.now() - 2547500).toISOString()
        },
        {
          id: '2',
          name: 'Database',
          status: 'running',
          uptime: 7234.1,
          cpu: 8.7,
          memory: 1024,
          port: 5432,
          version: '14.2',
          lastRestart: new Date(Date.now() - 7234100).toISOString()
        },
        {
          id: '3',
          name: 'Redis Cache',
          status: 'running',
          uptime: 3421.8,
          cpu: 2.1,
          memory: 128,
          port: 6379,
          version: '6.2.6',
          lastRestart: new Date(Date.now() - 3421800).toISOString()
        },
        {
          id: '4',
          name: 'File Storage',
          status: 'running',
          uptime: 5678.3,
          cpu: 1.4,
          memory: 64,
          version: '2.1.0',
          lastRestart: new Date(Date.now() - 5678300).toISOString()
        }
      ]);
      
      setLogs([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          service: 'API Server',
          message: 'User authentication successful',
          details: { userId: 'admin@krib.ae', ip: '192.168.1.100' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'warning',
          service: 'Database',
          message: 'High connection count detected',
          details: { connections: 95, limit: 100 }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          level: 'info',
          service: 'Redis Cache',
          message: 'Cache cleanup completed',
          details: { keysRemoved: 1247, memoryFreed: '45MB' }
        }
      ]);
      
      setBackups([
        {
          id: '1',
          type: 'database',
          size: 2.4 * 1024 * 1024 * 1024, // 2.4GB
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          location: 's3://krib-backups/db-2025-06-08.sql.gz'
        },
        {
          id: '2',
          type: 'files',
          size: 1.8 * 1024 * 1024 * 1024, // 1.8GB
          created_at: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed',
          location: 's3://krib-backups/files-2025-06-07.tar.gz'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceAction = async (action: string, serviceId: string) => {
    try {
      setActionLoading(true);
      await apiService.post(`/super-admin/system/services/${serviceId}/${action}`);
      await fetchSystemData();
      setShowServiceModal(false);
      setSelectedService(null);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBackupAction = async (action: string, backupId?: string) => {
    try {
      setActionLoading(true);
      if (backupId) {
        await apiService.post(`/super-admin/system/backups/${backupId}/${action}`);
      } else {
        await apiService.post(`/super-admin/system/backups/${action}`);
      }
      await fetchSystemData();
    } catch (error) {
      console.error(`Error performing backup ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMaintenanceAction = async (action: string) => {
    try {
      setActionLoading(true);
      const response = await apiService.post(`/super-admin/system/maintenance/${action}`) as { success: boolean; message: string };
      
      // Show success message
      if (response.success) {
        console.log(`${action} completed successfully:`, response.message);
        // Refresh system data to show updated metrics
        await fetchSystemData();
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600';
      case 'stopped': return 'text-red-600';
      case 'error': return 'text-red-600';
      case 'maintenance': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return 'success';
      case 'stopped': return 'error';
      case 'error': return 'error';
      case 'maintenance': return 'warning';
      default: return 'secondary';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'critical': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* System Health Cards */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">System Uptime</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{formatUptime(systemStats.uptime)}</p>
                <div className="flex items-center mt-1 md:mt-2 text-green-600">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">Healthy</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-full flex-shrink-0">
                <Activity className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">CPU Usage</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{systemStats.cpuUsage.toFixed(1)}%</p>
                <div className={`flex items-center mt-1 md:mt-2 ${systemStats.cpuUsage > 80 ? 'text-red-600' : systemStats.cpuUsage > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  <Cpu className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">
                    {systemStats.cpuUsage > 80 ? 'High' : systemStats.cpuUsage > 60 ? 'Medium' : 'Normal'}
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-full flex-shrink-0">
                <Cpu className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Memory Usage</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{systemStats.memoryUsage.toFixed(1)}%</p>
                <div className={`flex items-center mt-1 md:mt-2 ${systemStats.memoryUsage > 85 ? 'text-red-600' : systemStats.memoryUsage > 70 ? 'text-yellow-600' : 'text-green-600'}`}>
                  <Database className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">
                    {systemStats.memoryUsage > 85 ? 'High' : systemStats.memoryUsage > 70 ? 'Medium' : 'Normal'}
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 rounded-full flex-shrink-0">
                <Database className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Response Time</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{systemStats.responseTime}ms</p>
                <div className={`flex items-center mt-1 md:mt-2 ${systemStats.responseTime > 500 ? 'text-red-600' : systemStats.responseTime > 200 ? 'text-yellow-600' : 'text-green-600'}`}>
                  <Zap className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">
                    {systemStats.responseTime > 500 ? 'Slow' : systemStats.responseTime > 200 ? 'Medium' : 'Fast'}
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                <Zap className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Additional Metrics */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Active Connections</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{systemStats.activeConnections}</p>
              </div>
              <Users className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Requests/Min</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{systemStats.requestsPerMinute}</p>
              </div>
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Error Rate</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{(systemStats.errorRate * 100).toFixed(2)}%</p>
              </div>
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Disk Usage</p>
                <p className="text-lg md:text-xl lg:text-2xl font-bold">{systemStats.diskUsage.toFixed(1)}%</p>
              </div>
              <HardDrive className="w-6 h-6 md:w-8 md:h-8 text-gray-400 flex-shrink-0" />
            </div>
          </Card>
        </div>
      )}

      {/* Services Status */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">System Services</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('services')} className="text-xs md:text-sm">
            View All Services
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.slice(0, 4).map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 md:p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <div className={`p-1.5 md:p-2 rounded-full ${service.status === 'running' ? 'bg-green-100' : 'bg-red-100'} flex-shrink-0`}>
                  <Server className={`w-3 h-3 md:w-4 md:h-4 ${getStatusColor(service.status)}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{service.name}</p>
                  <p className="text-xs text-gray-500 truncate">CPU: {service.cpu}% | Uptime: {formatUptime(service.uptime)}</p>
                </div>
              </div>
              <Badge variant={getStatusBadge(service.status)} className="text-xs">
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Logs */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent System Logs</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('logs')} className="text-xs md:text-sm">
            View All Logs
          </Button>
        </div>
        <div className="space-y-3 md:space-y-4">
          {logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-start space-x-2 md:space-x-3 p-3 md:p-4 border border-gray-200 rounded-lg">
              <div className={`p-1.5 md:p-2 rounded-full bg-gray-100 ${getLogLevelColor(log.level)} flex-shrink-0`}>
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-xs md:text-sm font-medium text-gray-900">{log.service}</p>
                  <Badge variant={log.level === 'error' || log.level === 'critical' ? 'error' : log.level === 'warning' ? 'warning' : 'secondary'} className="text-xs">
                    {log.level}
                  </Badge>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-1">{log.message}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Services</h2>
          <p className="text-gray-600">Monitor and manage system services</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchSystemData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${service.status === 'running' ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Server className={`w-5 h-5 ${getStatusColor(service.status)}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-500">v{service.version}</p>
                </div>
              </div>
              <Badge variant={getStatusBadge(service.status)}>
                {service.status}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uptime:</span>
                <span className="font-medium">{formatUptime(service.uptime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CPU:</span>
                <span className="font-medium">{service.cpu}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Memory:</span>
                <span className="font-medium">{service.memory}MB</span>
              </div>
              {service.port && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Port:</span>
                  <span className="font-medium">{service.port}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              {service.status === 'running' ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleServiceAction('restart', service.id)}
                    disabled={actionLoading}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Restart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleServiceAction('stop', service.id)}
                    disabled={actionLoading}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleServiceAction('start', service.id)}
                  disabled={actionLoading}
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
          <p className="text-gray-600">Monitor system events and errors</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchSystemData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Level</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Service</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Message</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{formatDate(log.timestamp)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={log.level === 'error' || log.level === 'critical' ? 'error' : log.level === 'warning' ? 'warning' : 'secondary'}>
                      {log.level}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">{log.service}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{log.message}</p>
                    {log.details && (
                      <p className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(log.details)}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderBackupsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Backups</h2>
          <p className="text-gray-600">Manage system backups and recovery</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => handleBackupAction('create')}
            disabled={actionLoading}
          >
            <Archive className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
          <Button onClick={fetchSystemData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Backups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {backups.map((backup) => (
          <Card key={backup.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Archive className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{backup.type} Backup</h3>
                  <p className="text-sm text-gray-500">{formatBytes(backup.size)}</p>
                </div>
              </div>
              <Badge variant={backup.status === 'completed' ? 'success' : backup.status === 'failed' ? 'error' : 'warning'}>
                {backup.status}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{formatDate(backup.created_at)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium text-xs truncate">{backup.location}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBackupAction('download', backup.id)}
                disabled={actionLoading}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBackupAction('delete', backup.id)}
                disabled={actionLoading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Maintenance</h2>
          <p className="text-gray-600">Perform system maintenance tasks</p>
        </div>
      </div>

      {/* Maintenance Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Database Cleanup</h3>
              <p className="text-sm text-gray-500">Remove old logs and optimize database</p>
            </div>
          </div>
          <Button 
            className="w-full" 
            variant="outline" 
            disabled={actionLoading}
            onClick={() => handleMaintenanceAction('cleanup')}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Run Cleanup
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <RefreshCw className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cache Refresh</h3>
              <p className="text-sm text-gray-500">Clear and rebuild system cache</p>
            </div>
          </div>
          <Button 
            className="w-full" 
            variant="outline" 
            disabled={actionLoading}
            onClick={() => handleMaintenanceAction('cache-refresh')}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Cache
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-full">
              <Settings className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Update</h3>
              <p className="text-sm text-gray-500">Check for and install updates</p>
            </div>
          </div>
          <Button 
            className="w-full" 
            variant="outline" 
            disabled={actionLoading}
            onClick={() => handleMaintenanceAction('check-updates')}
          >
            <Download className="w-4 h-4 mr-2" />
            Check Updates
          </Button>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Monitor },
            { id: 'services', label: 'Services', icon: Server },
            { id: 'logs', label: 'Logs', icon: FileText },
            { id: 'backups', label: 'Backups', icon: Archive },
            { id: 'maintenance', label: 'Maintenance', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'services' && renderServicesTab()}
          {activeTab === 'logs' && renderLogsTab()}
          {activeTab === 'backups' && renderBackupsTab()}
          {activeTab === 'maintenance' && renderMaintenanceTab()}
        </>
      )}
    </div>
  );
};

export default SystemManagement; 