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

export default function SettingsPage() {
  const { level } = useXP()
  const [profile, setProfile] = useState<ProfileSettings>({ name: '', avatar: '', grade: '' })
  const [prefs, setPrefs] = useState<PreferencesSettings>({ difficulty: 'medium', pace: 'normal' })
  const [app, setApp] = useState<AppSettings>({ notifications: true, voiceEnabled: true, voice: 'sunny', theme: 'light', color: 'blue', privacyShare: false })

  useEffect(() => {
    try {
      const ps = localStorage.getItem('settings_profile'); if (ps) setProfile(JSON.parse(ps))
      const pf = localStorage.getItem('settings_prefs'); if (pf) setPrefs(JSON.parse(pf))
      const as = localStorage.getItem('settings_app'); if (as) setApp(JSON.parse(as))
    } catch {}
  }, [])

  const save = () => {
    localStorage.setItem('settings_profile', JSON.stringify(profile))
    localStorage.setItem('settings_prefs', JSON.stringify(prefs))
    localStorage.setItem('settings_app', JSON.stringify(app))
    toast.success('Settings saved')
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-black mb-6">Settings</h1>

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

        <div className="mt-6 flex justify-end">
          <Button onClick={save} size="lg">Save Settings</Button>
        </div>
      </div>
    </AppShell>
  )
}

