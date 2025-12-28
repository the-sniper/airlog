"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertTriangle } from "lucide-react";
import type { SessionWithDetails } from "@/types";
import {
  calculateSceneAnalytics,
  getHotspotScenes,
  getSceneCoverage,
} from "@/lib/analytics";

interface SceneAnalyticsCardProps {
  session: SessionWithDetails;
}

export function SceneAnalyticsCard({ session }: SceneAnalyticsCardProps) {
  const sceneAnalytics = useMemo(
    () => calculateSceneAnalytics(session),
    [session],
  );
  const hotspots = useMemo(
    () => getHotspotScenes(sceneAnalytics),
    [sceneAnalytics],
  );
  const coverage = useMemo(() => getSceneCoverage(session), [session]);

  const scenesWithNotes = sceneAnalytics.filter((s) => s.totalNotes > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Scene Analytics
        </CardTitle>
        <CardDescription>
          Bug density and engagement across testing scenes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold">
              {session.scenes?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Scenes</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold">{Math.round(coverage)}%</div>
            <div className="text-xs text-muted-foreground">Scene Coverage</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold text-[#fb7088]">
              {hotspots.length}
            </div>
            <div className="text-xs text-muted-foreground">
              Problem Hotspots
            </div>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="text-2xl font-bold">
              {scenesWithNotes.length > 0
                ? Math.round(
                    scenesWithNotes.reduce((sum, s) => sum + s.bugDensity, 0) /
                      scenesWithNotes.length,
                  )
                : 0}
              %
            </div>
            <div className="text-xs text-muted-foreground">Avg Bug Density</div>
          </div>
        </div>

        {/* Problem Hotspots */}
        {hotspots.length > 0 && (
          <div className="p-4 rounded-lg bg-[#fb7088]/10 border border-[#fb7088]/20">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#fb7088]" />
              <span className="font-medium text-[#fb7088]">
                Problem Hotspots
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotspots.map((scene) => (
                <Badge
                  key={scene.sceneId}
                  variant="destructive"
                  className="text-xs"
                >
                  {scene.sceneName} ({scene.bugCount} bugs)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
