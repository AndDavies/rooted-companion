'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Watch, User, Shield, Bell, Heart, HelpCircle, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const [dailyEmail, setDailyEmail] = useState(false);
  const [weeklyEmail, setWeeklyEmail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const loadUserAndSettings = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('User not authenticated');
          return;
        }

        setUserId(user.id);

        // Load user settings
        const { data: userData, error: settingsError } = await supabase
          .from('users')
          .select('receive_daily_email, receive_weekly_email')
          .eq('id', user.id)
          .single();

        if (settingsError) {
          console.error('Error loading settings:', settingsError);
          return;
        }

        setDailyEmail(userData?.receive_daily_email ?? false);
        setWeeklyEmail(userData?.receive_weekly_email ?? false);
      } catch (error) {
        console.error('Error loading user settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndSettings();
  }, [supabase]);

  const updateEmailSetting = async (setting: 'daily' | 'weekly', checked: boolean) => {
    if (!userId) return;

    setSaving(true);
    try {
      const updateData = setting === 'daily' 
        ? { receive_daily_email: checked }
        : { receive_weekly_email: checked };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('Error updating setting:', error);
        // Revert the state change on error
        if (setting === 'daily') {
          setDailyEmail(!checked);
        } else {
          setWeeklyEmail(!checked);
        }
      }
    } catch (error) {
      console.error('Error updating email setting:', error);
      // Revert the state change on error
      if (setting === 'daily') {
        setDailyEmail(!checked);
      } else {
        setWeeklyEmail(!checked);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Page Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-logo font-bold text-neutral-900">
            Settings
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl">
            Make the experience yours—preferences, connections, and privacy controls in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" className="h-10" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Link 
            href="/how-it-works#settings" 
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Learn more</span>
          </Link>
        </div>
      </div>

      {/* Content Container */}
      <div className="space-y-8">
        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Wellness Profile */}
          <Card className="border-neutral-200 hover:shadow-md transition-all duration-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span>Wellness Profile</span>
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Update your wellness preferences and recovery goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full transition-all duration-200">
                <Link href="/onboarding?update=true">
                  Update Wellness Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Device Integrations */}
          <Card className="border-neutral-200 hover:shadow-md transition-all duration-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Watch className="w-5 h-5 text-white" />
                </div>
                <span>Device Integrations</span>
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Connect your wellness wearables and fitness trackers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full transition-all duration-200">
                <Link href="/dashboard/settings/integrations">
                  Manage Integrations
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="border-neutral-200 hover:shadow-md transition-all duration-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-neutral-500 to-neutral-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span>Account</span>
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Manage your profile and account preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full transition-all duration-200" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-neutral-200 hover:shadow-md transition-all duration-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span>Privacy & Security</span>
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Control your data privacy and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full transition-all duration-200" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-neutral-200 hover:shadow-md transition-all duration-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <span>Notifications</span>
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Configure your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Loading settings...</span>
                    <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-neutral-900">Receive Daily Email</span>
                      <p className="text-sm text-neutral-600">Get your daily recovery pulse</p>
                    </div>
                    <Switch
                      checked={dailyEmail}
                      onCheckedChange={(checked: boolean) => {
                        setDailyEmail(checked);
                        updateEmailSetting('daily', checked);
                      }}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-neutral-900">Receive Weekly Email</span>
                      <p className="text-sm text-neutral-600">Weekly progress summary</p>
                    </div>
                    <Switch
                      checked={weeklyEmail}
                      onCheckedChange={(checked: boolean) => {
                        setWeeklyEmail(checked);
                        updateEmailSetting('weekly', checked);
                      }}
                      disabled={saving}
                    />
                  </div>

                  {saving && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Why am I seeing this? */}
        <Card className="border-neutral-200 shadow-sm bg-neutral-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-neutral-500 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-neutral-900">Why am I seeing this?</h3>
                <p className="text-sm text-neutral-600">
                  Settings help you personalize your ROOTED experience. 
                  Your preferences shape how you receive guidance and what data you share.
                </p>
                <Link 
                  href="/how-it-works#settings" 
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Learn more about settings and preferences
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 