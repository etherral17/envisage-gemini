import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Loader2, 
  Globe, 
  FileText, 
  CheckCircle2, 
  Copy,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/services/api'

interface ScrapingResult {
  url: string
  text: string
  words: string[]
  wordCount: number
  timestamp: string
  status: 'success' | 'error'
}

export function ScrapingTab() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ScrapingResult | null>(null)
  const [history, setHistory] = useState<ScrapingResult[]>([])

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    if (!apiService.isAuthenticated()) {
      toast.error('Please login first')
      return
    }

    setIsLoading(true)
    
    try {
      // Call scrape endpoint
      await apiService.scrape(url)
      
      // Get the scraped data
      const data = await apiService.getData()
      
      const words = data.text
        .toLowerCase()
        .split(/\s+/)
        .filter((word: string) => word.length > 3 && /^[a-z0-9]+$/i.test(word))
        .slice(0, 100)
      
      const newResult: ScrapingResult = {
        url: url,
        text: data.text,
        words: words,
        wordCount: words.length,
        timestamp: new Date().toISOString(),
        status: 'success'
      }
      
      setResult(newResult)
      setHistory(prev => [newResult, ...prev].slice(0, 10))
      toast.success('URL scraped successfully!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to scrape URL'
      toast.error(errorMsg)
      setResult({
        url,
        text: '',
        words: [],
        wordCount: 0,
        timestamp: new Date().toISOString(),
        status: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyWords = () => {
    if (result?.words) {
      navigator.clipboard.writeText(result.words.join('\n'))
      toast.success('Words copied to clipboard!')
    }
  }

  const handleDownload = () => {
    if (result?.words) {
      const blob = new Blob([result.words.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scraped-words-${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('File downloaded!')
    }
  }

  const clearHistory = () => {
    setHistory([])
    setResult(null)
    toast.info('History cleared')
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">Website URL Scraper</CardTitle>
              <p className="text-sm text-white/50">Extract words and content from any website</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Enter website URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>
            <Button
              onClick={handleScrape}
              disabled={isLoading || !apiService.isAuthenticated()}
              className="h-12 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scrape
                </>
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-white/10 transition-colors border-white/10 text-white/60"
              onClick={() => setUrl('https://github.com')}
            >
              github.com
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-white/10 transition-colors border-white/10 text-white/60"
              onClick={() => setUrl('https://stackoverflow.com')}
            >
              stackoverflow.com
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-white/10 transition-colors border-white/10 text-white/60"
              onClick={() => setUrl('https://medium.com')}
            >
              medium.com
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-white/10 transition-colors border-white/10 text-white/60"
              onClick={() => setUrl('https://dev.to')}
            >
              dev.to
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <Card className={`glass-card animate-slide-up ${result.status === 'error' ? 'border-red-500/30' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  result.status === 'error' 
                    ? 'bg-red-500/20 border-red-500/30' 
                    : 'bg-green-500/20 border-green-500/30'
                }`}>
                  {result.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg text-white">
                    {result.status === 'error' ? 'Scraping Failed' : 'Scraped Results'}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {result.status === 'error' ? (
                      <AlertCircle className="w-3 h-3 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    )}
                    <span className="text-xs text-white/50">{result.url}</span>
                  </div>
                </div>
              </div>
              {result.status === 'success' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyWords}
                    className="border-white/10 hover:bg-white/10 text-white/70"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="border-white/10 hover:bg-white/10 text-white/70"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 mb-1">Total Words</p>
                <p className="text-2xl font-bold text-white">{result.wordCount}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 mb-1">Character Count</p>
                <p className="text-2xl font-bold text-cyan-400">{result.text.length}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-white/50 mb-1">Scraped At</p>
                <p className="text-sm font-medium text-white">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {result.status === 'success' && (
              <div className="p-4 rounded-xl bg-black/30 border border-white/10">
                <p className="text-xs text-white/50 mb-3">Extracted Content</p>
                <ScrollArea className="h-48">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">
                    {result.text.substring(0, 1000)}
                    {result.text.length > 1000 && '...'}
                  </p>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">Recent Scrapes</CardTitle>
                  <p className="text-sm text-white/50">Last {history.length} scraping operations</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-white/50 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => setResult(item)}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-white/40" />
                      <span className="text-sm text-white/80 truncate max-w-md">{item.url}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="border-white/10 text-white/60">
                        {item.wordCount} words
                      </Badge>
                      <span className="text-xs text-white/40">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!result && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center border border-blue-500/20 mb-4 animate-float">
            <Search className="w-10 h-10 text-blue-400/50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Ready to Scrape</h3>
          <p className="text-white/50 max-w-md">
            Enter a website URL above to extract words and content. Your scraping history will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
