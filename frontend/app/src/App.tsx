import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrapingTab } from '@/sections/ScrapingTab'
import { WordCloudTab } from '@/sections/WordCloudTab'
import { MonitoringTab } from '@/sections/MonitoringTab'
import { LoginPage } from '@/pages/LoginPage'
import { 
  Globe, 
  Cloud, 
  Activity, 
  Zap,
  Shield,
  BarChart3,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiService } from '@/services/api'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('scraping')
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return apiService.isAuthenticated()
  })

  // Check if user is already authenticated on mount
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogout = () => {
    apiService.clearApiKey()
    setIsAuthenticated(false)
    setActiveTab('scraping')
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 bg-white/5 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center glow-blue">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur opacity-30" />
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">DataFlow Analytics</h1>
                  <p className="text-xs text-white/50">Advanced Web Intelligence Platform</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">System Online</span>
                </div>
                <div className="flex items-center gap-2 text-white/50">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Secure Connection</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white hover:bg-red-500/10 border border-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col gap-6">
              {/* Tab Navigation */}
              <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-3 p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
                <TabsTrigger 
                  value="scraping" 
                  className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white/60 transition-all duration-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border data-[state=active]:border-blue-500/30"
                >
                  <Globe className="w-4 h-4" />
                  <span>URL Scraping</span>
                  {activeTab === 'scraping' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 animate-fade-in" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="wordcloud"
                  className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white/60 transition-all duration-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border data-[state=active]:border-purple-500/30"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Word Cloud</span>
                  {activeTab === 'wordcloud' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-fade-in" />
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="monitoring"
                  className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white/60 transition-all duration-300 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-teal-500/20 data-[state=active]:border data-[state=active]:border-emerald-500/30"
                >
                  <Activity className="w-4 h-4" />
                  <span>Monitoring</span>
                  {activeTab === 'monitoring' && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 animate-fade-in" />
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab Contents */}
              <div className="min-h-[600px]">
                <TabsContent value="scraping" className="mt-0 animate-fade-in">
                  <ScrapingTab />
                </TabsContent>
                
                <TabsContent value="wordcloud" className="mt-0 animate-fade-in">
                  <WordCloudTab />
                </TabsContent>
                
                <TabsContent value="monitoring" className="mt-0 animate-fade-in">
                  <MonitoringTab />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between text-white/40 text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>DataFlow Analytics Dashboard v1.0</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
