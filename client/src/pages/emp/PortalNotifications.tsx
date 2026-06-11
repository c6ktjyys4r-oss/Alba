import PortalLayout from "./PortalLayout";
  import { trpc } from "@/lib/trpc";

  const TYPE_ICONS: Record<string, string> = {
    request_submitted: "📬",
    request_approved: "✅",
    request_rejected: "❌",
    request_comment: "💬",
  };

  export default function PortalNotifications() {
    const utils = trpc.useUtils();
    const { data: notifications, isLoading } = trpc.empPortal.myNotifications.useQuery(undefined, { retry: false });
    const markRead = trpc.empPortal.markNotificationRead.useMutation({ onSuccess: () => utils.empPortal.myNotifications.invalidate() });
    const markAll = trpc.empPortal.markAllRead.useMutation({ onSuccess: () => utils.empPortal.myNotifications.invalidate() });

    const unread = notifications?.filter((n: any) => !n.isRead).length ?? 0;

    return (
      <PortalLayout>
        <div className="p-8 max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              <p className="text-slate-500 mt-1">{unread > 0 ? `${unread} unread notification${unread > 1 ? "s" : ""}` : "All caught up!"}</p>
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-slate-400">Loading notifications...</div>
          ) : (notifications?.length ?? 0) === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔔</div>
              <p className="text-slate-500 font-medium">No notifications yet</p>
              <p className="text-slate-400 text-sm mt-1">You'll be notified when your requests are reviewed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications?.map((n: any) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    n.isRead ? "bg-white border-slate-100 opacity-70" : "bg-blue-50 border-blue-200"
                  }`}
                  onClick={() => { if (!n.isRead) markRead.mutate({ id: n.id }); }}
                >
                  <div className="text-2xl flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.isRead ? "text-slate-600" : "text-slate-900 font-medium"}`}>{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </PortalLayout>
    );
  }
  