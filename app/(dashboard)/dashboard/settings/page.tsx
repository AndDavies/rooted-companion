import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Watch, User, Shield, Bell, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings - ROOTED Way Companion",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-logo font-bold text-neutral-900 mb-2">
          Settings
        </h1>
        <p className="text-neutral-600">
          Manage your account, preferences, and connected devices.
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Wellness Profile */}
        <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
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
        <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
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
        <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
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
        <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
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
        <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
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
            <Button variant="outline" className="w-full transition-all duration-200" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 