'use client';

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/ui/TabNavigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useXP } from '@/contexts/XPContext'
import { toast } from 'sonner'

type Theme = 'light' | 'dark'

interface ProfileSettings {
  name: string
  avatar: string
  grade: string
}

interface PreferencesSettings {
  difficulty: 'easy' | 'medium' | 'hard'
  pace: 'slow' | 'normal' | 'fast'
}

interface AppSettings {
  notifications: boolean
  voiceEnabled: boolean
  voice: 'sunny' | 'robot' | 'nature'
  theme: Theme
  color: 'blue' | 'purple' | 'green' | 'orange'
  privacyShare: boolean
  parentPin?: string
}

interface BrainModeSettings {
  showThinking: boolean
  showAdaptation: boolean
  showPatterns: boolean
  adaptiveSpeed: 'instant' | 'gradual' | 'conservative'
  interventionLevel: 'high' | 'medium' | 'low'
}

export default function SettingsPage() {
  const { level } = useXP()
  const [profile, setProfile] = useState<ProfileSettings>({ name: '', avatar: '', grade: '' })
  const [prefs, setPrefs] = useState<PreferencesSettings>({ difficulty: 'medium', pace: 'normal' })
  const [app, setApp] = useState<AppSettings>({ notifications: true, voiceEnabled: true, voice: 'sunny', theme: 'light', color: 'blue', privacyShare: false })
  const [brain, setBrain] = useState<BrainModeSettings>({
    showThinking: true,
    showAdaptation: true,
    showPatterns: true,
    adaptiveSpeed: 'gradual',
    interventionLevel: 'medium'
  })

  useEffect(() => {
    try {
      const ps = localStorage.getItem('settings_profile'); if (ps) setProfile(JSON.parse(ps))
      const pf = localStorage.getItem('settings_prefs'); if (pf) setPrefs(JSON.parse(pf))
      const as = localStorage.getItem('settings_app'); if (as) setApp(JSON.parse(as))
      const bs = localStorage.getItem('settings_brain'); if (bs) setBrain(JSON.parse(bs))
    } catch {}
  }, [])

  const save = () => {
    localStorage.setItem('settings_profile', JSON.stringify(profile))
    localStorage.setItem('settings_prefs', JSON.stringify(prefs))
    localStorage.setItem('settings_app', JSON.stringify(app))
    localStorage.setItem('settings_brain', JSON.stringify(brain))
    toast.success('Settings saved')
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2">Settings</h1>
          <p className="text-gray-600">Customize your learning experience and see how Sunny adapts to you</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4">Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Name</label>
                <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-semibold">Avatar URL</label>
                <Input value={profile.avatar} onChange={e => setProfile({ ...profile, avatar: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-semibold">Grade</label>
                <Input value={profile.grade} onChange={e => setProfile({ ...profile, grade: e.target.value })} placeholder="e.g., 3rd" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4">Learning Preferences</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Difficulty</label>
                <select className="w-full border-2 border-black rounded-md p-2" value={prefs.difficulty} onChange={e => setPrefs({ ...prefs, difficulty: e.target.value as any })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Pace</label>
                <select className="w-full border-2 border-black rounded-md p-2" value={prefs.pace} onChange={e => setPrefs({ ...prefs, pace: e.target.value as any })}>
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4">Notifications & Voice</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={app.notifications} onChange={e => setApp({ ...app, notifications: e.target.checked })} />
                <span className="font-semibold">Enable notifications</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={app.voiceEnabled} onChange={e => setApp({ ...app, voiceEnabled: e.target.checked })} />
                <span className="font-semibold">Enable voice</span>
              </label>
              <div>
                <label className="text-sm font-semibold">Voice selection</label>
                <select className="w-full border-2 border-black rounded-md p-2" value={app.voice} onChange={e => setApp({ ...app, voice: e.target.value as any })}>
                  <option value="sunny">Sunny</option>
                  <option value="robot">Robot</option>
                  <option value="nature">Nature</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4">Theme</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold">Mode</label>
                <select className="w-full border-2 border-black rounded-md p-2" value={app.theme} onChange={e => setApp({ ...app, theme: e.target.value as Theme })}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold">Color</label>
                <select className="w-full border-2 border-black rounded-md p-2" value={app.color} onChange={e => setApp({ ...app, color: e.target.value as any })}>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4">Privacy</h2>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={app.privacyShare} onChange={e => setApp({ ...app, privacyShare: e.target.checked })} />
              <span className="font-semibold">Allow anonymous usage analytics</span>
            </label>
          </Card>

          <Card className="p-6 border-2 border-black">
            <h2 className="text-xl font-bold mb-4">Parent Controls</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Parent PIN</label>
                <Input value={app.parentPin || ''} onChange={e => setApp({ ...app, parentPin: e.target.value })} placeholder="Optional" />
              </div>
              <p className="text-xs text-gray-600">Current level: {level}. Some features may require a PIN.</p>
            </div>
          </Card>
        </div>

        {/* Brain Mode & Adaptive Learning Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-1">🧠 Brain Mode & Adaptive Learning</h2>
            <p className="text-sm text-gray-600">Control how Sunny's AI adapts to your learning style</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">👁️</span>
                Visibility Settings
              </h2>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={brain.showThinking} 
                    onChange={e => setBrain({ ...brain, showThinking: e.target.checked })} 
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold">Show Thinking Process</span>
                    <p className="text-xs text-gray-600">See how Sunny analyzes your answers in real-time</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={brain.showAdaptation} 
                    onChange={e => setBrain({ ...brain, showAdaptation: e.target.checked })} 
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold">Show Adaptation Alerts</span>
                    <p className="text-xs text-gray-600">Get notified when difficulty adjusts</p>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={brain.showPatterns} 
                    onChange={e => setBrain({ ...brain, showPatterns: e.target.checked })} 
                    className="w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold">Show Pattern Detection</span>
                    <p className="text-xs text-gray-600">See what patterns Sunny discovers about you</p>
                  </div>
                </label>
              </div>
            </Card>

            <Card className="p-6 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Adaptation Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Adaptive Speed</label>
                  <select 
                    className="w-full border-2 border-black rounded-md p-2" 
                    value={brain.adaptiveSpeed} 
                    onChange={e => setBrain({ ...brain, adaptiveSpeed: e.target.value as any })}
                  >
                    <option value="instant">Instant - Adapt immediately</option>
                    <option value="gradual">Gradual - Adapt after patterns</option>
                    <option value="conservative">Conservative - Adapt slowly</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">How quickly Sunny adjusts difficulty</p>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Intervention Level</label>
                  <select 
                    className="w-full border-2 border-black rounded-md p-2" 
                    value={brain.interventionLevel} 
                    onChange={e => setBrain({ ...brain, interventionLevel: e.target.value as any })}
                  >
                    <option value="high">High - Help often</option>
                    <option value="medium">Medium - Balanced support</option>
                    <option value="low">Low - Minimal help</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">How much Sunny steps in to help</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white lg:col-span-2">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Core Learning Functions
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl mb-2">🎯</div>
                  <h3 className="font-bold mb-1">Real-time Adaptation</h3>
                  <p className="text-xs text-gray-600">Sunny adjusts difficulty based on your performance, not just scores</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-bold mb-1">Pattern Detection</h3>
                  <p className="text-xs text-gray-600">Identifies when you're struggling, guessing, or excelling</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="text-2xl mb-2">💡</div>
                  <h3 className="font-bold mb-1">Smart Interventions</h3>
                  <p className="text-xs text-gray-600">Provides help exactly when needed, not too early or late</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={save} size="lg">Save Settings</Button>
        </div>
      </div>
    </AppShell>
  )
}

