import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Globe, 
  ShieldAlert, 
  ShieldCheck,
  Clock,
  Search,
  RefreshCw,
  Ban,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Server,
  Zap,
  Download,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/services/api'

interface RequestLog {
  id: number
  timestamp: string
  method: string
  path: string
  ip: string
  status: number
  api_key?: string
  waf_reason?: string
  [key: string]: unknown
}

interface IPListItem {
  ip: string
  reason: string
  addedAt: string
  addedBy: string
  country?: string
  attempts?: number
}

// Mock data generators (for block/allow lists only)
const generateBlockList = (): IPListItem[] => [
  { ip: '192.168.1.100', reason: 'Multiple failed login attempts', addedAt: '2024-03-08T10:30:00Z', addedBy: 'admin', country: 'RU', attempts: 45 },
  { ip: '10.0.0.55', reason: 'DDoS attack pattern detected', addedAt: '2024-03-08T09:15:00Z', addedBy: 'system', country: 'CN', attempts: 1234 },
  { ip: '172.16.0.23', reason: 'Suspicious scraping activity', addedAt: '2024-03-07T16:45:00Z', addedBy: 'admin', country: 'BR', attempts: 89 },
]

const generateAllowList = (): IPListItem[] => [
  { ip: '192.168.1.1', reason: 'Internal gateway', addedAt: '2024-01-01T00:00:00Z', addedBy: 'admin', country: 'US' },
  { ip: '10.0.0.0/8', reason: 'Internal network range', addedAt: '2024-01-01T00:00:00Z', addedBy: 'admin', country: 'US' },
]

export function MonitoringTab() {
  const [requests, setRequests] = useState<RequestLog[]>([])
  const [blockList, setBlockList] = useState<IPListItem[]>(generateBlockList())
  const [allowList, setAllowList] = useState<IPListItem[]>(generateAllowList())
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [wafEnabled, setWafEnabled] = useState(false)
  const [stats, setStats] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    avgResponseTime: 0
  })

  // Load logs on mount
  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const logsData = await apiService.getLogs(50)
      setRequests(logsData)

      // Calculate stats
      const totalRequests = logsData.length
      const blockedRequests = logsData.filter(r => r.waf_reason).length
      const successRequests = logsData.filter(r => r.status >= 200 && r.status < 300).length
      const failedRequests = logsData.filter(r => r.status >= 400).length

      setStats({
        totalRequests,
        blockedRequests,
        successRequests,
        failedRequests,
        avgResponseTime: 145
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load logs'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      await loadLogs()
      toast.success('Data refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleWaf = async (action: 'enable' | 'disable') => {
    try {
      const result = await apiService.toggleWaf(action)
      setWafEnabled(result.waf_enabled)
      toast.success(`WAF ${action}d successfully`)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to toggle WAF'
      toast.error(errorMsg)
    }
  }

  const filteredRequests = requests.filter(req => 
    req.ip.includes(searchQuery) ||
    req.path.includes(searchQuery) ||
    req.method.includes(searchQuery)
  )

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-500/20 text-green-400 border-green-500/30'
    if (status >= 400 && status < 500) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    return 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      'GET': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'POST': 'bg-green-500/20 text-green-400 border-green-500/30',
      'PUT': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'DELETE': 'bg-red-500/20 text-red-400 border-red-500/30'
    }
    return colors[method] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const removeFromBlockList = (ip: string) => {
    setBlockList(prev => prev.filter(item => item.ip !== ip))
    toast.success(`Removed ${ip} from block list`)
  }

  const removeFromAllowList = (ip: string) => {
    setAllowList(prev => prev.filter(item => item.ip !== ip))
    toast.success(`Removed ${ip} from allow list`)
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">Total Requests</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5%</span>
              <span className="text-white/40 ml-1">vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">Blocked</p>
                <p className="text-2xl font-bold text-red-400">{stats.blockedRequests.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-red-400">
              <TrendingUp className="w-3 h-3" />
              <span>+5.2%</span>
              <span className="text-white/40 ml-1">vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">Active Connections</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.activeConnections}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Healthy</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">Avg Response</p>
                <p className="text-2xl font-bold text-purple-400">{Math.round(stats.avgResponseTime)}ms</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <TrendingDown className="w-3 h-3" />
              <span>-8ms</span>
              <span className="text-white/40 ml-1">vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">Uptime</p>
                <p className="text-2xl font-bold text-green-400">{stats.uptime}%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
              <Clock className="w-3 h-3" />
              <span>24d 12h 34m</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="w-full max-w-2xl grid grid-cols-4 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
          <TabsTrigger 
            value="requests" 
            className="flex items-center gap-2 py-2.5 text-sm font-medium text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-lg transition-all"
          >
            <Activity className="w-4 h-4" />
            Requests
          </TabsTrigger>
          <TabsTrigger 
            value="blocked"
            className="flex items-center gap-2 py-2.5 text-sm font-medium text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-lg transition-all"
          >
            <Ban className="w-4 h-4" />
            Blocked IPs
            <Badge variant="outline" className="ml-1 text-xs border-red-500/30 text-red-400">
              {blockList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="allowed"
            className="flex items-center gap-2 py-2.5 text-sm font-medium text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-lg transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Allowed IPs
            <Badge variant="outline" className="ml-1 text-xs border-green-500/30 text-green-400">
              {allowList.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="flex items-center gap-2 py-2.5 text-sm font-medium text-white/60 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-lg transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Request Logs</CardTitle>
                    <p className="text-sm text-white/50">Real-time API request monitoring</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input
                      placeholder="Search by IP, path, or method..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="border-white/10 hover:bg-white/10 text-white/70"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/10 hover:bg-white/10 text-white/70"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-white/60">Loading request logs...</p>
                  </div>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="text-center">
                    <Activity className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60">No requests yet</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-[#0a0f1c]/95 backdrop-blur-xl">
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Time</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Method</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Path</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">IP Address</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((req) => (
                        <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-sm text-white/70">
                            {new Date(req.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getMethodColor(req.method)}>
                              {req.method}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-white/80 font-mono">{req.path}</td>
                          <td className="py-3 px-4 text-sm text-white/70 font-mono">{req.ip}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={getStatusColor(req.status)}>
                              {req.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {req.waf_reason ? (
                              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                WAF Block
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                Request
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Blocked IP Addresses</CardTitle>
                    <p className="text-sm text-white/50">IPs blocked due to suspicious activity</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/10 text-white/70"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add IP
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {blockList.map((item) => (
                    <div
                      key={item.ip}
                      className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <Ban className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-white">{item.ip}</span>
                            <span className="text-lg">{getCountryFlag(item.country)}</span>
                            <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
                              {item.attempts} attempts
                            </Badge>
                          </div>
                          <p className="text-xs text-white/50 mt-1">{item.reason}</p>
                          <p className="text-xs text-white/40">
                            Added {new Date(item.addedAt).toLocaleString()} by {item.addedBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromBlockList(item.ip)}
                          className="text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allowed IPs Tab */}
        <TabsContent value="allowed" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Allowed IP Addresses</CardTitle>
                    <p className="text-sm text-white/50">Whitelisted IPs with unrestricted access</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 hover:bg-white/10 text-white/70"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add IP
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {allowList.map((item) => (
                    <div
                      key={item.ip}
                      className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-white">{item.ip}</span>
                            <span className="text-lg">{getCountryFlag(item.country)}</span>
                            <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                              Whitelisted
                            </Badge>
                          </div>
                          <p className="text-xs text-white/50 mt-1">{item.reason}</p>
                          <p className="text-xs text-white/40">
                            Added {new Date(item.addedAt).toLocaleString()} by {item.addedBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromAllowList(item.ip)}
                          className="text-white/50 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4">
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Security Controls</CardTitle>
                    <p className="text-sm text-white/50">Manage security features and WAF settings</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* WAF Status */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-400" />
                      Web Application Firewall (WAF)
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Current status: <span className={wafEnabled ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                        {wafEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </p>
                  </div>
                  <Badge variant="outline" className={wafEnabled ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}>
                    {wafEnabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleToggleWaf('enable')}
                    disabled={wafEnabled || isRefreshing}
                    className="border-green-500/30 hover:bg-green-500/10 text-green-400 flex-1"
                  >
                    {isRefreshing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Enable WAF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleToggleWaf('disable')}
                    disabled={!wafEnabled || isRefreshing}
                    className="border-red-500/30 hover:bg-red-500/10 text-red-400 flex-1"
                  >
                    {isRefreshing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Disable WAF
                  </Button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-2">Successful Requests</p>
                  <p className="text-2xl font-bold text-green-400">{stats.successRequests}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-2">Failed Requests</p>
                  <p className="text-2xl font-bold text-red-400">{stats.failedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Alert Banner */}
      <Card className="glass-card border-l-4 border-l-yellow-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Security Notice</p>
              <p className="text-sm text-white/60">
                {blockList.length} IPs are currently blocked. Review the block list regularly to ensure legitimate users aren't being blocked.
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/10 text-white/70">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    'US': '🇺🇸', 'UK': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 
    'JP': '🇯🇵', 'IN': '🇮🇳', 'BR': '🇧🇷', 'CA': '🇨🇦',
    'RU': '🇷🇺', 'CN': '🇨🇳', 'KP': '🇰🇵'
  }
  return flags[countryCode] || '🌐'
}
