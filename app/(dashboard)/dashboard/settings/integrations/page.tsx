import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { disconnectGarmin } from "./actions";
import { Activity, Heart, Watch, CheckCircle, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Integrations - ROOTED Way Companion",
  description: "Connect external services and tools to enhance your recovery journey",
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not found')
  }

  let connected = false;
  let connectionInfo = null;
  
  const { data } = await supabase
    .from('wearable_connections')
    .select('id, wearable_user_id, created_at, scopes')
    .eq('user_id', user.id)
    .eq('wearable_type', 'garmin')
    .maybeSingle();
  
  connected = !!data;
  connectionInfo = data;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-logo font-bold text-neutral-900 mb-2">
          Device Integrations
        </h1>
        <p className="text-neutral-600">
          Connect your wellness wearables to unlock richer insights and personalized recommendations.
        </p>
      </div>

      {/* Error Message */}
      {searchParams.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Connection Error
              </p>
              <p className="text-sm text-red-600">
                {searchParams.error === 'missing_params' && 'Missing authorization parameters. Please try again.'}
                {searchParams.error === 'invalid_state' && 'Invalid authorization state. Please try again.'}
                {searchParams.error === 'token' && 'Failed to exchange authorization code. Please try again.'}
                {searchParams.error === 'user' && 'Failed to retrieve user information. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Garmin Integration Card */}
      <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              {/* Use Garmin logo if available, otherwise fallback to icon */}
              <Image 
                src="/logos/garmin-logo.png" 
                alt="Garmin" 
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
                onError={() => {
                  // Fallback to Watch icon if logo fails to load
                  // This will be handled by the hidden Watch icon
                }}
              />
              <Watch className="w-5 h-5 text-white hidden" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Garmin Connect</span>
                {connected && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Connected</span>
                  </div>
                )}
              </div>
            </div>
          </CardTitle>
          <CardDescription className="text-neutral-600">
            Sync your heart rate variability, sleep, stress, and respiration data from Garmin devices for personalized recovery insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connected && connectionInfo ? (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Garmin User ID</span>
                  <span className="text-sm font-medium text-neutral-900">{connectionInfo.wearable_user_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600">Connected</span>
                  <span className="text-sm font-medium text-neutral-900">
                    {new Date(connectionInfo.created_at).toLocaleDateString()}
                  </span>
                </div>
                {connectionInfo.scopes && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-neutral-600">Permissions</span>
                    <span className="text-sm font-medium text-neutral-900 text-right">
                      {connectionInfo.scopes.join(', ')}
                    </span>
                  </div>
                )}
              </div>
              
              <form action={disconnectGarmin}>
                <Button 
                  type="submit" 
                  variant="outline"
                  className="w-full transition-all duration-200"
                >
                  Disconnect Garmin
                </Button>
              </form>
            </div>
          ) : (
            <Button asChild className="w-full transition-all duration-200">
              <Link href="/dashboard/settings/integrations/garmin-connect">
                Connect Garmin
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Future Integrations */}
      <div>
        <h2 className="text-xl font-logo font-semibold text-neutral-900 mb-4">
          Coming Soon
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="opacity-60 border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-lg">Whoop</span>
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Connect your Whoop device for advanced recovery insights and strain analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outline" className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 border-neutral-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-lg">Oura Ring</span>
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Sync sleep and readiness data from your Oura Ring for comprehensive wellness tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled variant="outline" className="w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 