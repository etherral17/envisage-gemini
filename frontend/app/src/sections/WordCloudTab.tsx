import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Cloud, 
  RefreshCw, 
  Download, 
  Palette, 
  Settings2,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react'
import { toast } from 'sonner'
import { apiService } from '@/services/api'

interface WordData {
  text: string
  value: number
}

const colorSchemes = {
  ocean: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6', '#6366f1'],
  sunset: ['#f97316', '#ef4444', '#ec4899', '#f59e0b', '#d946ef'],
  forest: ['#22c55e', '#16a34a', '#15803d', '#84cc16', '#10b981'],
  neon: ['#a855f7', '#d946ef', '#f472b6', '#22d3ee', '#34d399'],
  fire: ['#dc2626', '#ea580c', '#f59e0b', '#fbbf24', '#f87171'],
}

export function WordCloudTab() {
  const [words, setWords] = useState<WordData[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [colorScheme, setColorScheme] = useState<keyof typeof colorSchemes>('ocean')
  const [fontSizeRange, setFontSizeRange] = useState([20, 80])
  const [rotation, setRotation] = useState(true)
  const [padding, setPadding] = useState(5)
  const [wordcloudImageUrl, setWordcloudImageUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load word cloud data when component mounts
  useEffect(() => {
    loadWordCloudData()
    // Try to load existing wordcloud image
    loadExistingWordCloud()
  }, [])

  const loadExistingWordCloud = async () => {
    if (!apiService.isAuthenticated()) {
      return
    }
    try {
      const response = await apiService.getWordCloud()
      if (response.wordcloud_path) {
        // Construct full URL for image
        const imageUrl = apiService.getImageUrl(response.wordcloud_path)
        setWordcloudImageUrl(imageUrl)
      }
    } catch (error) {
      // No wordcloud exists yet, that's fine
    }
  }

  const loadWordCloudData = async () => {
    if (!apiService.isAuthenticated()) {
      toast.error('Please login first')
      return
    }

    setIsLoading(true)
    try {
      const data = await apiService.getData()
      const wordFreq: { [key: string]: number } = {}
      
      // Process text to extract word frequencies
      const words_list = data.text.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
      
      words_list.forEach(word => {
        const cleanWord = word.replace(/[^a-z0-9]/g, '')
        if (cleanWord) {
          wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1
        }
      })

      // Convert to array and sort by frequency
      const maxFreq = Math.max(...Object.values(wordFreq), 1)
      const wordArray: WordData[] = Object.entries(wordFreq)
        .map(([text, count]) => ({
          text,
          value: (count / maxFreq) * 100
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50)

      setWords(wordArray)
      toast.success('Word cloud data loaded!')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load word cloud data'
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const generateWordCloud = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const containerWidth = canvas.parentElement?.clientWidth || 800
    const containerHeight = 500
    canvas.width = containerWidth * 2
    canvas.height = containerHeight * 2
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${containerHeight}px`
    ctx.scale(2, 2)

    // Clear canvas
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, containerWidth, containerHeight)

    const colors = colorSchemes[colorScheme]
    const placedWords: { text: string; x: number; y: number; width: number; height: number; fontSize: number; angle: number }[] = []

    // Sort words by value (descending)
    const sortedWords = [...words].sort((a, b) => b.value - a.value)

    const centerX = containerWidth / 2
    const centerY = containerHeight / 2

    sortedWords.forEach((word, index) => {
      const fontSize = Math.max(
        fontSizeRange[0],
        Math.min(fontSizeRange[1], (word.value / 100) * fontSizeRange[1])
      )
      
      ctx.font = `bold ${fontSize}px Inter, sans-serif`
      const metrics = ctx.measureText(word.text)
      const textWidth = metrics.width
      const textHeight = fontSize

      // Spiral placement algorithm
      let angle = 0
      let radius = 0
      let x = centerX
      let y = centerY
      let placed = false
      const angleStep = 0.5
      const radiusStep = 5
      const maxRadius = Math.min(centerX, centerY) - 50

      const wordAngle = rotation && index % 3 === 0 ? (Math.random() > 0.5 ? 90 : 0) : 0

      while (radius < maxRadius && !placed) {
        x = centerX + radius * Math.cos(angle)
        y = centerY + radius * Math.sin(angle)

        // Check collision with placed words
        let collision = false
        for (const placedWord of placedWords) {
          const dx = x - placedWord.x
          const dy = y - placedWord.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const minDistance = (textWidth + placedWord.width) / 2 + padding
          
          if (distance < minDistance) {
            collision = true
            break
          }
        }

        if (!collision) {
          placed = true
          placedWords.push({
            text: word.text,
            x,
            y,
            width: textWidth,
            height: textHeight,
            fontSize,
            angle: wordAngle
          })
        }

        angle += angleStep
        radius += radiusStep * angleStep / (2 * Math.PI)
      }

      if (placed) {
        ctx.save()
        ctx.translate(x, y)
        if (wordAngle !== 0) {
          ctx.rotate((wordAngle * Math.PI) / 180)
        }
        
        const color = colors[index % colors.length]
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(word.text, 0, 0)
        ctx.restore()
      }
    })
  }, [words, colorScheme, fontSizeRange, rotation, padding])

  useEffect(() => {
    generateWordCloud()
  }, [generateWordCloud])

  const handleRegenerate = async () => {
    if (!apiService.isAuthenticated()) {
      toast.error('Please login first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await apiService.generateWordCloud()
      // Construct full URL for image
      const imageUrl = apiService.getImageUrl(response.wordcloud_path)
      setWordcloudImageUrl(imageUrl)
      toast.success('Word cloud generated successfully!')
      // Also reload the word data for the UI
      await loadWordCloudData()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate wordcloud'
      toast.error(errorMsg)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (wordcloudImageUrl) {
      // Download from backend-generated image
      try {
        const response = await fetch(wordcloudImageUrl)
        const blob = await response.blob()
        const link = document.createElement('a')
        link.download = `wordcloud-${Date.now()}.png`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
        toast.success('Word cloud downloaded!')
      } catch (error) {
        toast.error('Failed to download word cloud')
      }
    } else {
      // Download from canvas
      const canvas = canvasRef.current
      if (!canvas) return

      const link = document.createElement('a')
      link.download = `wordcloud-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('Word cloud downloaded!')
    }
  }

  if (words.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-purple-500/20 mb-4">
          <Cloud className="w-10 h-10 text-purple-400/50" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
        <p className="text-white/50 max-w-md mb-6">
          Please scrape a website first to generate a word cloud.
        </p>
        <Button
          onClick={loadWordCloudData}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Load Data
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-white/50 mb-1">Total Words</p>
            <p className="text-2xl font-bold text-white">{words.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-white/50 mb-1">Max Frequency</p>
            <p className="text-2xl font-bold text-cyan-400">
              {Math.max(...words.map(w => w.value))}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-white/50 mb-1">Avg Frequency</p>
            <p className="text-2xl font-bold text-purple-400">
              {Math.round(words.reduce((a, b) => a + b.value, 0) / words.length)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-xs text-white/50 mb-1">Color Scheme</p>
            <p className="text-lg font-bold capitalize" style={{ color: colorSchemes[colorScheme][0] }}>
              {colorScheme}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Word Cloud Canvas */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <Cloud className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-white">Word Cloud Visualization</CardTitle>
                  <p className="text-sm text-white/50">Interactive text frequency visualization</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="border-white/10 hover:bg-white/10 text-white/70"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Generate Word Cloud
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-white/10 hover:bg-white/10 text-white/70"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-transparent border border-white/10">
              {wordcloudImageUrl ? (
                <div className="relative w-full">
                  <img 
                    src={wordcloudImageUrl} 
                    alt="Generated Word Cloud" 
                    className="w-full h-auto rounded-lg"
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        <p className="text-white/70">Generating word cloud...</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-[500px]"
                  />
                  {isGenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        <p className="text-white/70">Generating word cloud...</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls Panel */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <Settings2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Configuration</CardTitle>
                <p className="text-sm text-white/50">Customize visualization</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Scheme */}
            <div className="space-y-3">
              <Label className="text-white/70 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Color Scheme
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(colorSchemes).map(([name, colors]) => (
                  <button
                    key={name}
                    onClick={() => setColorScheme(name as keyof typeof colorSchemes)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      colorScheme === name 
                        ? 'border-white scale-110' 
                        : 'border-transparent hover:border-white/30'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${colors[0]}, ${colors[2]})`
                    }}
                    title={name}
                  />
                ))}
              </div>
            </div>

            {/* Font Size Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Font Size Range</Label>
                <span className="text-xs text-white/50">
                  {fontSizeRange[0]} - {fontSizeRange[1]}px
                </span>
              </div>
              <Slider
                value={fontSizeRange}
                onValueChange={setFontSizeRange}
                min={10}
                max={120}
                step={5}
                className="w-full"
              />
            </div>

            {/* Padding */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Word Padding</Label>
                <span className="text-xs text-white/50">{padding}px</span>
              </div>
              <Slider
                value={[padding]}
                onValueChange={([v]) => setPadding(v)}
                min={0}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {/* Rotation Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-white/50" />
                <Label className="text-white/70 cursor-pointer">Enable Rotation</Label>
              </div>
              <Switch
                checked={rotation}
                onCheckedChange={setRotation}
              />
            </div>

            {/* Word List Preview */}
            <div className="space-y-3">
              <Label className="text-white/70 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Top Words
              </Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {words
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 15)
                  .map((word, index) => (
                    <Badge
                      key={word.text}
                      variant="outline"
                      className="border-white/10 text-white/70"
                      style={{
                        fontSize: `${Math.max(10, 14 - index * 0.5)}px`
                      }}
                    >
                      {word.text} ({word.value})
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="glass-card border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white">Pro Tip</p>
              <p className="text-sm text-white/60">
                Adjust the font size range and padding to create different visual effects. 
                Smaller padding creates denser clouds, while larger fonts emphasize top words.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
