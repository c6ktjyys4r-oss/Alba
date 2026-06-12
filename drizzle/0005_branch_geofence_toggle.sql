-- Branch geofence toggle: per-branch flag to exempt a branch from GPS geofencing
-- (e.g. management / remote staff who have no fixed location but must still punch).
-- Migration: 0005_branch_geofence_toggle

ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "geofenceEnabled" boolean DEFAULT true NOT NULL;
