import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Zap, Lock, ArrowRight, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/services/api'

interface LoginPageProps {
  onLoginSuccess: () => void
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await apiService.login()
      toast.success('Login successful! Redirecting to dashboard...')
      // Small delay for user feedback
      setTimeout(() => {
        onLoginSuccess()
      }, 500)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] relative overflow-hidden flex items-center justify-center">
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
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center glow-blue shadow-2xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur opacity-30 animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold gradient-text mb-2">DataFlow</h1>
          <p className="text-white/60 text-lg">Advanced Web Intelligence Platform</p>
          <p className="text-white/40 text-sm mt-2">Secure scraping and intelligent data analysis</p>
        </div>

        {/* Login Card */}
        <div className="glass-card backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <div className="space-y-8">
            {/* Features List */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Fast Scraping</p>
                  <p className="text-xs text-white/50">Extract content instantly</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Secure</p>
                  <p className="text-xs text-white/50">Protected with encryption</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">API Secured</p>
                  <p className="text-xs text-white/50">Key-based authentication</p>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Login with API Key
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </Button>

            {/* Info Text */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-200 text-center">
                Click the button above to generate your secure API key and access the dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm">
            Secure scraping powered by modern technology
          </p>
          <p className="text-white/20 text-xs mt-2">
            v1.0 © 2024 DataFlow Analytics
          </p>
        </div>
      </div>
    </div>
  )
}
