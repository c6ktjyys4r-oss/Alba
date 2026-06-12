import { useState } from "react";
import PortalLayout from "./PortalLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        if (err.code === err.PERMISSION_DENIED)
          reject(new Error("Location permission denied. Please allow location access in your browser and try again."));
        else if (err.code === err.TIMEOUT)
          reject(new Error("Timed out while getting your location. Please try again."));
        else reject(new Error("Could not determine your location. Please try again."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function fmtMinutes(mins?: number | null) {
  if (!mins || mins <= 0) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function PortalAttendance() {
  const utils = trpc.useUtils();
  const { data: status, isLoading } = trpc.empPortal.attendanceStatus.useQuery(undefined, { retry: false });
  const today = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const { data: history = [] } = trpc.empPortal.myAttendanceHistory.useQuery(
    { dateFrom: from, dateTo: today },
    { retry: false }
  );
  const [busy, setBusy] = useState<null | "check_in" | "check_out">(null);

  const tz = status?.timezone || "Asia/Riyadh";
  const fmtTime = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz }) : "—";

  const checkInMut = trpc.empPortal.checkIn.useMutation({
    onSuccess: (d: any) => {
      toast.success(`Checked in at ${d.time}${d.distanceMeters != null ? ` · ${d.distanceMeters}m from branch` : ""}`);
      utils.empPortal.attendanceStatus.invalidate();
      utils.empPortal.myAttendanceHistory.invalidate();
    },
  });
  const checkOutMut = trpc.empPortal.checkOut.useMutation({
    onSuccess: (d: any) => {
      toast.success(`Checked out at ${d.time}${d.distanceMeters != null ? ` · ${d.distanceMeters}m from branch` : ""}`);
      utils.empPortal.attendanceStatus.invalidate();
      utils.empPortal.myAttendanceHistory.invalidate();
    },
  });

  const doPunch = async (type: "check_in" | "check_out") => {
    setBusy(type);
    try {
      const exempt = status?.branch?.geofenceEnabled === false;
      let payload: { latitude?: number; longitude?: number; accuracy?: number } = {};
      try {
        const pos = await getPosition();
        payload = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      } catch (geoErr) {
        if (!exempt) throw geoErr;
        // Geofence-exempt branch (e.g. management / remote staff): location is optional.
      }
      if (type === "check_in") await checkInMut.mutateAsync(payload);
      else await checkOutMut.mutateAsync(payload);
    } catch (e: any) {
      toast.error(e?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const branchConfigured = status?.branch?.configured;
  const noBranch = status && !status.branch;

  return (
    <PortalLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString("en-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Status / Action card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm mb-6">
          {isLoading ? (
            <div className="h-40 animate-pulse bg-slate-50 rounded-xl" />
          ) : (
            <>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm text-slate-500">Current status</p>
                  <p className={`text-2xl font-bold mt-1 ${status?.checkedIn ? "text-green-600" : "text-slate-700"}`}>
                    {status?.checkedIn ? "Checked In" : "Not Checked In"}
                  </p>
                  {status?.branch && (
                    <p className="text-sm text-slate-500 mt-1">
                      Branch: <span className="font-medium text-slate-700">{status.branch.name}</span>
                      {status.branch.geofenceEnabled === false
                        ? " · GPS check not required"
                        : status.branch.geofenceRadiusMeters
                        ? ` · allowed radius ${status.branch.geofenceRadiusMeters}m`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400">Check In</p>
                    <p className="text-lg font-semibold text-slate-800">{fmtTime(status?.firstCheckIn)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Check Out</p>
                    <p className="text-lg font-semibold text-slate-800">{fmtTime(status?.lastCheckOut)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Total Hours</p>
                    <p className="text-lg font-semibold text-slate-800">{fmtMinutes(status?.workedMinutes)}</p>
                  </div>
                </div>
              </div>

              {noBranch && (
                <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  You are not assigned to a branch yet. Please contact HR before using attendance.
                </div>
              )}
              {status?.branch && !branchConfigured && (
                <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  Your branch location has not been configured yet. Please contact your administrator.
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => doPunch("check_in")}
                  disabled={!status?.canCheckIn || !branchConfigured || busy !== null}
                  className="flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white py-4 text-base font-semibold shadow-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {busy === "check_in" ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {busy === "check_in" ? "Locating…" : "Check In"}
                </button>
                <button
                  onClick={() => doPunch("check_out")}
                  disabled={!status?.canCheckOut || !branchConfigured || busy !== null}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 text-white py-4 text-base font-semibold shadow-sm hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {busy === "check_out" ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                    </svg>
                  )}
                  {busy === "check_out" ? "Locating…" : "Check Out"}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">
                {status?.branch?.geofenceEnabled === false
                  ? "You can check in or out from anywhere — GPS location is optional for your branch."
                  : "Your location is captured only when you tap a button, and only to confirm you are at your branch."}
              </p>
            </>
          )}
        </div>

        {/* Today's punches */}
        {status?.events && status.events.length > 0 && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-slate-900 mb-3">Today's Activity</h2>
            <div className="space-y-2">
              {status.events.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                  <span className={`font-medium ${e.type === "check_in" ? "text-green-600" : "text-slate-700"}`}>
                    {e.type === "check_in" ? "Check In" : "Check Out"}
                  </span>
                  <span className="text-slate-600">{fmtTime(e.eventAt)}</span>
                  <span className="text-xs text-slate-400">{e.distanceMeters != null ? `${Math.round(e.distanceMeters)}m` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">History (last 30 days)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                  <th className="text-start px-5 py-3 font-medium">Date</th>
                  <th className="text-start px-5 py-3 font-medium">Check In</th>
                  <th className="text-start px-5 py-3 font-medium">Check Out</th>
                  <th className="text-start px-5 py-3 font-medium">Hours</th>
                  <th className="text-start px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400">No attendance records yet.</td>
                  </tr>
                ) : (
                  history.map((r: any) => (
                    <tr key={r.id} className="border-b border-slate-50">
                      <td className="px-5 py-3 text-slate-700">{r.date}</td>
                      <td className="px-5 py-3 text-slate-600">{fmtTime(r.checkIn)}</td>
                      <td className="px-5 py-3 text-slate-600">{fmtTime(r.checkOut)}</td>
                      <td className="px-5 py-3 text-slate-600">{fmtMinutes(r.workedMinutes)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 capitalize">
                          {(r.status || "").replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
