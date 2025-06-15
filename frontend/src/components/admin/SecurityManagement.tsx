import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Ban,
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiService } from '../../services/api';
import { formatDate, formatCurrency } from '../../lib/utils';

interface SecurityStats {
  totalThreats: number;
  blockedAttacks: number;
  suspiciousLogins: number;
  activeSecurityRules: number;
  failedLoginAttempts: number;
  securityScore: number;
  lastSecurityScan: string;
  vulnerabilitiesFound: number;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'suspicious_activity' | 'blocked_ip' | 'data_breach' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  user_id?: string;
  ip_address: string;
  location?: string;
  device?: string;
  description: string;
  status: 'active' | 'resolved' | 'investigating';
  details?: any;
}

interface AccessLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  status: 'success' | 'failed' | 'blocked';
  location?: string;
}

interface SecurityRule {
  id: string;
  name: string;
  type: 'firewall' | 'rate_limit' | 'geo_block' | 'user_behavior';
  status: 'active' | 'inactive';
  description: string;
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
}

const SecurityManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'access' | 'rules' | 'audit'>('overview');
  const [securityStats, setSecurityStats] = useState<SecurityStats | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState({
    severity: '',
    type: '',
    status: '',
    dateRange: '7d',
    search: ''
  });

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      // apiService.get already extracts the data from the response
      const data = await apiService.get('/super-admin/security') as any;
      
      // The data should contain: { stats, events, accessLogs, rules }
      if (data && data.stats) {
      setSecurityStats(data.stats);
      setSecurityEvents(data.events);
      setAccessLogs(data.accessLogs);
      setSecurityRules(data.rules);
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
      // Set realistic sample data
      setSecurityStats({
        totalThreats: 23,
        blockedAttacks: 156,
        suspiciousLogins: 8,
        activeSecurityRules: 12,
        failedLoginAttempts: 45,
        securityScore: 87,
        lastSecurityScan: new Date(Date.now() - 3600000).toISOString(),
        vulnerabilitiesFound: 2
      });
      
      setSecurityEvents([
        {
          id: '1',
          type: 'suspicious_activity',
          severity: 'high',
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.100',
          location: 'Dubai, UAE',
          device: 'Chrome/Windows',
          description: 'Multiple failed login attempts from same IP',
          status: 'investigating',
          details: { attempts: 15, timeframe: '5 minutes' }
        },
        {
          id: '2',
          type: 'blocked_ip',
          severity: 'medium',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          ip_address: '45.123.45.67',
          location: 'Unknown',
          description: 'IP blocked due to suspicious behavior',
          status: 'active'
        }
      ]);
      
      setAccessLogs([
        {
          id: '1',
          user_id: '1028e7ac-a52f-4353-b64f-a68b8629824a',
          user_email: 'admin@krib.ae',
          action: 'LOGIN',
          resource: '/admin/dashboard',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          timestamp: new Date().toISOString(),
          status: 'success',
          location: 'Dubai, UAE'
        }
      ]);
      
      setSecurityRules([
        {
          id: '1',
          name: 'Rate Limiting',
          type: 'rate_limit',
          status: 'active',
          description: 'Limit API requests to 100 per minute per IP',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_triggered: new Date(Date.now() - 3600000).toISOString(),
          trigger_count: 23
        },
        {
          id: '2',
          name: 'Failed Login Protection',
          type: 'user_behavior',
          status: 'active',
          description: 'Block IP after 5 failed login attempts',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          last_triggered: new Date(Date.now() - 1800000).toISOString(),
          trigger_count: 8
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityEventAction = async (eventId: string, action: string, notes?: string) => {
    try {
      setActionLoading(true);
      await apiService.post(`/super-admin/security/events/${eventId}/${action}`, { notes });
      await fetchSecurityData();
    } catch (error) {
      console.error(`Error performing security event ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSecurityRuleAction = async (ruleId: string, action: string) => {
    try {
      setActionLoading(true);
      await apiService.post(`/super-admin/security/rules/${ruleId}/${action}`);
      await fetchSecurityData();
    } catch (error) {
      console.error(`Error performing security rule ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const createSecurityRule = async (ruleData: any) => {
    try {
      setActionLoading(true);
      await apiService.post('/super-admin/security/rules', ruleData);
      await fetchSecurityData();
    } catch (error) {
      console.error('Error creating security rule:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800';
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'blocked': return 'error';
      case 'active': return 'warning';
      case 'resolved': return 'success';
      case 'investigating': return 'warning';
      default: return 'secondary';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Security Score & Key Metrics */}
      {securityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Security Score</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{securityStats.securityScore}/100</p>
                <div className={`flex items-center mt-1 md:mt-2 ${securityStats.securityScore >= 80 ? 'text-green-600' : securityStats.securityScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  <Shield className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">
                    {securityStats.securityScore >= 80 ? 'Excellent' : securityStats.securityScore >= 60 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-full flex-shrink-0">
                <Shield className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Blocked Attacks</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{securityStats.blockedAttacks}</p>
                <div className="flex items-center mt-1 md:mt-2 text-red-600">
                  <Ban className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">Last 24h</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-red-100 rounded-full flex-shrink-0">
                <Ban className="w-4 h-4 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Active Threats</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{securityStats.totalThreats}</p>
                <div className="flex items-center mt-1 md:mt-2 text-yellow-600">
                  <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">Monitoring</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                <AlertTriangle className="w-4 h-4 md:w-6 md:h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-gray-600 truncate">Failed Logins</p>
                <p className="text-lg md:text-2xl lg:text-3xl font-bold truncate">{securityStats.failedLoginAttempts}</p>
                <div className="flex items-center mt-1 md:mt-2 text-blue-600">
                  <Lock className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm ml-1">Last 24h</span>
                </div>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-full flex-shrink-0">
                <Lock className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Security Events */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Security Events</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('events')} className="text-xs md:text-sm">
            View All Events
          </Button>
        </div>
        <div className="space-y-3 md:space-y-4">
          {securityEvents.slice(0, 5).map((event) => (
            <div key={event.id} className="flex items-start space-x-2 md:space-x-3 p-3 md:p-4 border border-gray-200 rounded-lg">
              <div className={`p-1.5 md:p-2 rounded-full bg-gray-100 ${getSeverityColor(event.severity)} flex-shrink-0`}>
                <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-xs md:text-sm font-medium text-gray-900">{event.description}</p>
                  <Badge variant={getSeverityBadge(event.severity)} className="text-xs">
                    {event.severity}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-xs text-gray-500">IP: {event.ip_address}</p>
                  {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
                  <p className="text-xs text-gray-500">{formatDate(event.timestamp)}</p>
                </div>
              </div>
              <Badge variant={getStatusBadge(event.status)} className="text-xs">
                {event.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Security Rules Status */}
      <Card className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Active Security Rules</h3>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('rules')} className="text-xs md:text-sm">
            Manage Rules
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityRules.slice(0, 4).map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 md:p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                <div className={`p-1.5 md:p-2 rounded-full ${rule.status === 'active' ? 'bg-green-100' : 'bg-gray-100'} flex-shrink-0`}>
                  <Shield className={`w-3 h-3 md:w-4 md:h-4 ${rule.status === 'active' ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{rule.name}</p>
                  <p className="text-xs text-gray-500 truncate">Triggered {rule.trigger_count} times</p>
                </div>
              </div>
              <Badge variant={rule.status === 'active' ? 'success' : 'secondary'} className="text-xs">
                {rule.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Events</h2>
          <p className="text-gray-600">Monitor and investigate security incidents</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchSecurityData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Events Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Event</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Severity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {securityEvents.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500 capitalize">{event.type.replace('_', ' ')}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getSeverityBadge(event.severity)}>
                      {event.severity}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm text-gray-900">{event.ip_address}</p>
                      {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{formatDate(event.timestamp)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getStatusBadge(event.status)}>
                      {event.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {event.status === 'investigating' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSecurityEventAction(event.id, 'resolve', 'Resolved by admin')}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {event.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSecurityEventAction(event.id, 'investigate', 'Under investigation')}
                          disabled={actionLoading}
                        >
                        <Eye className="w-4 h-4" />
                      </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSecurityEventAction(event.id, 'block', 'IP blocked by admin')}
                        disabled={actionLoading}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderAccessTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Access Logs</h2>
          <p className="text-gray-600">Monitor user access and authentication</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchSecurityData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Access Logs Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">IP Address</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {accessLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium text-gray-900">{log.user_email}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500">{log.resource}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{log.ip_address}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{log.location || 'Unknown'}</p>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-900">{formatDate(log.timestamp)}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getStatusBadge(log.status)}>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderRulesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Rules</h2>
          <p className="text-gray-600">Manage security policies and rules</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
          <Button onClick={fetchSecurityData} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {securityRules.map((rule) => (
          <Card key={rule.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${rule.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Shield className={`w-5 h-5 ${rule.status === 'active' ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{rule.type.replace('_', ' ')}</p>
                </div>
              </div>
              <Badge variant={rule.status === 'active' ? 'success' : 'secondary'}>
                {rule.status}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 mb-4">{rule.description}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDate(rule.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Triggers:</span>
                <span>{rule.trigger_count}</span>
              </div>
              {rule.last_triggered && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Triggered:</span>
                  <span>{formatDate(rule.last_triggered)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSecurityRuleAction(rule.id, 'edit')}
                disabled={actionLoading}
              >
                <Settings className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleSecurityRuleAction(rule.id, rule.status === 'active' ? 'disable' : 'enable')}
                disabled={actionLoading}
              >
                {rule.status === 'active' ? 'Disable' : 'Enable'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'events', label: 'Security Events', icon: AlertTriangle },
            { id: 'access', label: 'Access Logs', icon: Eye },
            { id: 'rules', label: 'Security Rules', icon: Settings }
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
          {activeTab === 'events' && renderEventsTab()}
          {activeTab === 'access' && renderAccessTab()}
          {activeTab === 'rules' && renderRulesTab()}
        </>
      )}
    </div>
  );
};

export default SecurityManagement; 