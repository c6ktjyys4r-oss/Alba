import { useState } from "react";
  import PortalLayout from "./PortalLayout";
  import { trpc } from "@/lib/trpc";
  import { useLocation } from "wouter";

  const TYPE_OPTIONS = [
    { value: "annual_leave", label: "Annual Leave", icon: "🌴", desc: "Request paid annual leave days" },
    { value: "sick_leave", label: "Sick Leave", icon: "🏥", desc: "Report illness — medical certificate required" },
    { value: "late_arrival", label: "Late Arrival", icon: "⏰", desc: "Notify about arriving late to work" },
    { value: "early_exit", label: "Early Exit", icon: "🚪", desc: "Request to leave work early" },
  ] as const;

  type RequestType = typeof TYPE_OPTIONS[number]["value"];

  export default function PortalNewRequest() {
    const [, navigate] = useLocation();
    const [type, setType] = useState<RequestType | "">("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [requestedDate, setRequestedDate] = useState("");
    const [requestedTime, setRequestedTime] = useState("");
    const [shiftStartTime, setShiftStartTime] = useState("");
    const [reason, setReason] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");
    const [attachmentKey, setAttachmentKey] = useState("");
    const [fileLoading, setFileLoading] = useState(false);
    const [error, setError] = useState("");

    const utils = trpc.useUtils();
    const { data: balance } = trpc.empPortal.myLeaveBalance.useQuery(undefined, { retry: false });

    const uploadMutation = trpc.empPortal.uploadDocument.useMutation({
      onSuccess: (res) => { setAttachmentUrl(res.url); setAttachmentKey(res.key); setFileLoading(false); },
      onError: (err) => { setError(err.message); setFileLoading(false); },
    });

    const submitMutation = trpc.empPortal.submitRequest.useMutation({
      onSuccess: () => {
        utils.empPortal.myRequests.invalidate();
        utils.empPortal.myLeaveBalance.invalidate();
        navigate("/emp/requests");
      },
      onError: (err) => setError(err.message),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { setError("File must be under 10 MB"); return; }
      setFileLoading(true);
      setError("");
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMutation.mutate({ filename: file.name, contentBase64: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    };

    const calcDays = () => {
      if (!startDate || !endDate) return 0;
      const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
      return Math.max(1, Math.round(ms / 86400000) + 1);
    };

    const validateLateArrival = () => {
      if (type !== "late_arrival" || !requestedDate || !shiftStartTime) return true;
      const shiftStart = new Date(`${requestedDate}T${shiftStartTime}:00`);
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      return shiftStart >= twoHoursFromNow;
    };

    const minStartDate = () => {
      if (type !== "annual_leave") return undefined;
      const d = new Date();
      d.setDate(d.getDate() + 14);
      return d.toISOString().split("T")[0];
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (type === "sick_leave" && !attachmentUrl) {
        setError("Please upload a medical certificate before submitting.");
        return;
      }
      if (type === "annual_leave" && calcDays() > (balance?.annualDaysTotal ?? 21) - (balance?.annualDaysUsed ?? 0)) {
        setError("Requested days exceed your available annual leave balance.");
        return;
      }
      if (type === "late_arrival" && !validateLateArrival()) {
        setError("Late arrival must be submitted at least 2 hours before shift start time.");
        return;
      }

      submitMutation.mutate({
        type: type as RequestType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        requestedDate: requestedDate || undefined,
        requestedTime: requestedTime || undefined,
        shiftStartTime: shiftStartTime || undefined,
        reason: reason || undefined,
        attachmentUrl: attachmentUrl || undefined,
        attachmentKey: attachmentKey || undefined,
        daysRequested: type === "annual_leave" ? calcDays() : undefined,
      });
    };

    const annualRemaining = (balance?.annualDaysTotal ?? 21) - (balance?.annualDaysUsed ?? 0);

    return (
      <PortalLayout>
        <div className="p-8 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Submit a Request</h1>
            <p className="text-slate-500 mt-1">Choose the request type and fill in the details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Request Type</label>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value} type="button"
                    onClick={() => { setType(opt.value); setError(""); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${type === opt.value ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <p className="text-2xl mb-1">{opt.icon}</p>
                    <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {type === "annual_leave" && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  📋 Available balance: <strong>{annualRemaining} days</strong> of {balance?.annualDaysTotal ?? 21} · Start date must be at least 2 weeks from today
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                    <input type="date" min={minStartDate()} value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                    <input type="date" min={startDate || minStartDate()} value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                  </div>
                </div>
                {startDate && endDate && <p className="text-sm text-slate-600">Total: <strong>{calcDays()} day{calcDays() > 1 ? "s" : ""}</strong></p>}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" placeholder="Additional notes..." />
                </div>
              </div>
            )}

            {type === "sick_leave" && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  🏥 A medical certificate is required. Please upload it before submitting.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date *</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date *</label>
                    <input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medical Certificate *</label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center ${attachmentUrl ? "border-green-400 bg-green-50" : "border-slate-300"}`}>
                    {attachmentUrl ? (
                      <div className="text-green-600">
                        <p className="font-medium">✅ Certificate uploaded</p>
                        <button type="button" onClick={() => { setAttachmentUrl(""); setAttachmentKey(""); }} className="text-sm underline mt-1">Remove</button>
                      </div>
                    ) : fileLoading ? (
                      <p className="text-slate-500">Uploading...</p>
                    ) : (
                      <label className="cursor-pointer">
                        <p className="text-slate-500 text-sm">Click to upload PDF or image</p>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" placeholder="Additional notes..." />
                </div>
              </div>
            )}

            {type === "late_arrival" && (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                  ⏰ Must be submitted at least 2 hours before your shift start time.
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                    <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Shift Start Time *</label>
                    <input type="time" value={shiftStartTime} onChange={(e) => setShiftStartTime(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expected Arrival Time *</label>
                  <input type="time" value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Delay *</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" placeholder="Please explain the reason for your late arrival..." required />
                </div>
              </div>
            )}

            {type === "early_exit" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Requested Departure Time *</label>
                  <input type="time" value={requestedTime} onChange={(e) => setRequestedTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none" placeholder="Please explain why you need to leave early..." required />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {type && (
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => navigate("/emp/requests")}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitMutation.isPending || fileLoading}
                  className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {submitMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            )}
          </form>
        </div>
      </PortalLayout>
    );
  }
  