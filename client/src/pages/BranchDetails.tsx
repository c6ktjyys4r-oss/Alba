import { useParams, useLocation } from "wouter";
    import { trpc } from "@/lib/trpc";
    import { Button } from "@/components/ui/button";
    import {
      ChevronLeft, MapPin, Phone, User2, Users,
      Crown, Stethoscope, HeartPulse, Briefcase, UserCheck,
    } from "lucide-react";
    import { cn } from "@/lib/utils";

    const GROUP_ORDER = ["Branch Manager", "Administrative Staff", "Doctors", "Nursing Staff"] as const;
    type GroupName = typeof GROUP_ORDER[number];

    /**
     * Build a Set of employee IDs that are Branch Managers using all available signals:
     *   1. erpRole === "branch_manager"
     *   2. jobTitle contains "branch manager" or Arabic equivalents
     *   3. Employee full name matches branch.managerName (at least 2 significant words)
     */
    function identifyBranchManagerIds(empList: any[], branch: any): Set<number> {
      const ids = new Set<number>();
      const mgrName  = (branch?.managerName || "").toLowerCase().trim();
      const mgrWords = mgrName.split(/\s+/).filter((w: string) => w.length >= 3);

      for (const emp of empList) {
        const role  = (emp.erpRole  || "").toLowerCase();
        const title = (emp.jobTitle || "").toLowerCase();

        if (role === "branch_manager") { ids.add(emp.id); continue; }

        if (
          title.includes("branch manager") ||
          title.includes("مدير فرع")      ||
          title.includes("مدير الفرع")
        ) { ids.add(emp.id); continue; }

        if (mgrWords.length >= 2) {
          const empName  = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
          const empWords = empName.split(/\s+/).filter((w: string) => w.length >= 3);
          const matched  = mgrWords.filter((w: string) => empWords.includes(w)).length;
          if (matched >= 2) { ids.add(emp.id); continue; }
        }
      }
      return ids;
    }

    function classifyEmployee(emp: any, departments: any[], branchMgrIds: Set<number>): GroupName {
      if (branchMgrIds.has(emp.id)) return "Branch Manager";

      if (emp.departmentId) {
        const dept     = departments.find((d: any) => d.id === emp.departmentId);
        const combined = ((dept?.name || "") + " " + (dept?.nameAr || "")).toLowerCase();

        if (combined.includes("nursing") || combined.includes("تمريض")) return "Nursing Staff";
        if (
          combined.includes("dental")    || combined.includes("دنتال") ||
          combined.includes("doctor")    || combined.includes("طبيب")  ||
          combined.includes("physician") || combined.includes("clinic") ||
          combined.includes("medical")   || combined.includes("طب")
        ) return "Doctors";
        return "Administrative Staff";
      }

      const title = (emp.jobTitle || "").toLowerCase();
      if (title.includes("nurse") || title.includes("nursing") || title.includes("ممرض") || title.includes("تمريض")) return "Nursing Staff";
      if (
        title.includes("doctor")    || title.includes("physician") ||
        title.includes("دكتور")    || title.includes("طبيب")       ||
        title.includes("specialist")
      ) return "Doctors";
      return "Administrative Staff";
    }

    const GROUP_ICON: Record<GroupName, React.ReactNode> = {
      "Branch Manager":       <Crown size={15} className="text-amber-500" />,
      "Doctors":              <Stethoscope size={15} className="text-blue-500" />,
      "Nursing Staff":        <HeartPulse size={15} className="text-rose-500" />,
      "Administrative Staff": <Briefcase size={15} className="text-slate-500" />,
    };

    function shortName(firstName: string, lastName: string): string {
      const first     = (firstName || "").trim();
      const lastFirst = (lastName  || "").trim().split(/\s+/)[0];
      return lastFirst ? `${first} ${lastFirst}` : first;
    }

    function findDeptForGroup(groupName: GroupName, departments: any[]): any | null {
      if (groupName === "Nursing Staff") {
        return departments.find((d) => {
          const n = ((d.name || "") + " " + (d.nameAr || "")).toLowerCase();
          return n.includes("nursing") || n.includes("تمريض");
        }) ?? null;
      }
      if (groupName === "Doctors") {
        return departments.find((d) => {
          const n = ((d.name || "") + " " + (d.nameAr || "")).toLowerCase();
          return (
            n.includes("dental")    || n.includes("دنتال") ||
            n.includes("doctor")    || n.includes("طبيب")  ||
            n.includes("physician") || n.includes("clinic") ||
            n.includes("medical")   || n.includes("طب")
          );
        }) ?? null;
      }
      if (groupName === "Administrative Staff") {
        return departments.find((d) => {
          const n        = ((d.name || "") + " " + (d.nameAr || "")).toLowerCase();
          const isNursing = n.includes("nursing") || n.includes("تمريض");
          const isDoctors =
            n.includes("dental")    || n.includes("دنتال") ||
            n.includes("doctor")    || n.includes("طبيب")  ||
            n.includes("physician") || n.includes("clinic") ||
            n.includes("medical")   || n.includes("طب");
          return !isNursing && !isDoctors;
        }) ?? null;
      }
      return null;
    }

    function statusClasses(status: string) {
      if (status === "active")   return "bg-green-50 text-green-700 border border-green-200";
      if (status === "on_leave") return "bg-amber-50 text-amber-700 border border-amber-200";
      return "bg-slate-100 text-slate-500 border border-slate-200";
    }

    /** Small gold star badge wrapping a first name. */
    function StarName({ name }: { name: string }) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs">
          <span className="text-[11px] leading-none">⭐</span>
          {name}
        </span>
      );
    }

    export default function BranchDetails() {
      const params = useParams<{ id: string }>();
      const [, setLocation] = useLocation();
      const branchId = Number(params.id);
      const utils    = trpc.useUtils();

      const { data: branch, isLoading: loadBranch } = trpc.branch.getById.useQuery(
        { id: branchId }, { enabled: !!branchId }
      );
      const { data: employees = [], isLoading: loadEmps } = trpc.employee.list.useQuery(
        { branchId }, { enabled: !!branchId }
      );
      const { data: departments = [] } = trpc.department.list.useQuery(
        { branchId }, { enabled: !!branchId }
      );

      const updateDept = trpc.department.update.useMutation({
        onSuccess: () => utils.department.list.invalidate(),
      });

      if (loadBranch || loadEmps) {
        return (
          <div className="p-6 space-y-4">
            <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 w-64 bg-slate-100 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        );
      }

      if (!branch) return <div className="p-6 text-slate-400">Branch not found.</div>;

      const empList  = employees   as any[];
      const deptList = departments as any[];

      const branchMgrIds = identifyBranchManagerIds(empList, branch);

      const grouped: Record<GroupName, any[]> = {
        "Branch Manager":       [],
        "Administrative Staff": [],
        "Doctors":              [],
        "Nursing Staff":        [],
      };
      empList.forEach((e) => grouped[classifyEmployee(e, deptList, branchMgrIds)].push(e));

      const branchManager = grouped["Branch Manager"][0] ?? null;

      return (
        <div className="p-4 lg:p-6 space-y-6">
          <Button
            variant="ghost" size="sm"
            className="gap-1.5 text-slate-500 -ml-2"
            onClick={() => setLocation("/branches")}
          >
            <ChevronLeft size={16} /> Back to Branches
          </Button>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">{branch.name}</h1>
            {(branch as any).nameAr && (
              <p className="text-slate-500 text-sm mt-0.5">{(branch as any).nameAr}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: <User2 size={16} className="text-blue-600" />,   bg: "bg-blue-50",   label: "Manager",        value: (branch as any).managerName || "—" },
              { icon: <MapPin size={16} className="text-green-600" />, bg: "bg-green-50",  label: "City / Address", value: (branch as any).address     || "—" },
              { icon: <Phone size={16} className="text-amber-600" />,  bg: "bg-amber-50",  label: "Phone",          value: (branch as any).phone       || "—" },
              { icon: <Users size={16} className="text-violet-600" />, bg: "bg-violet-50", label: "Employees",      value: empList.length },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.bg}`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {empList.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No employees assigned to this branch</p>
            </div>
          ) : (
            <div className="space-y-8">
              {GROUP_ORDER.map((groupName) => {
                const emps = grouped[groupName];
                if (!emps || emps.length === 0) return null;

                const isMgr     = groupName === "Branch Manager";
                const isDoctors = groupName === "Doctors";

                const dept = findDeptForGroup(groupName, deptList);

                // ── Direct Manager current value ─────────────────────────────
                // Doctors: always the Branch Manager (auto-assigned, read-only).
                // Others: pulled from dept.directManagerId.
                const directMgrId: number | null = isDoctors
                  ? (branchManager?.id ?? null)
                  : (dept?.directManagerId ?? null);

                // ── Dropdown candidates ──────────────────────────────────────
                // Only same-department employees (by actual departmentId).
                // Branch Managers are EXCLUDED — they are not department supervisors.
                const deptMembers = (!isDoctors && dept)
                  ? empList.filter(
                      (e) => e.departmentId === dept.id && !branchMgrIds.has(e.id)
                    )
                  : [];

                // Currently selected manager (for the display badge)
                const selectedMgr = directMgrId
                  ? empList.find((e) => e.id === directMgrId) ?? null
                  : null;

                return (
                  <section key={groupName}>
                    {/* ── Group header ── */}
                    <div className="flex items-center gap-2 mb-2">
                      {GROUP_ICON[groupName]}
                      <h2 className={cn(
                        "text-sm font-semibold uppercase tracking-wide",
                        isMgr ? "text-amber-700" : "text-slate-600"
                      )}>
                        {groupName}
                      </h2>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        isMgr ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {emps.length}
                      </span>
                    </div>

                    {/* ── Direct Manager bar (skip for Branch Manager group) ── */}
                    {!isMgr && (
                      <div className="flex items-center gap-2 mb-4 text-xs flex-wrap">
                        <UserCheck size={13} className="text-slate-400 shrink-0" />
                        <span className="text-slate-500 shrink-0">Direct Manager:</span>

                        {isDoctors ? (
                          /* Doctors — read-only, always Branch Manager */
                          branchManager ? (
                            <StarName name={branchManager.firstName} />
                          ) : (
                            <span className="text-slate-400 italic">No Branch Manager assigned</span>
                          )
                        ) : dept ? (
                          /* Administrative / Nursing — display badge + change dropdown */
                          <div className="flex items-center gap-2 flex-wrap">
                            {selectedMgr ? (
                              <StarName name={selectedMgr.firstName} />
                            ) : (
                              <span className="text-slate-400 italic">Not assigned</span>
                            )}
                            <select
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-100"
                              value={directMgrId ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateDept.mutate({
                                  id: dept.id,
                                  directManagerId: val ? Number(val) : null,
                                });
                              }}
                            >
                              <option value="">— Change —</option>
                              {deptMembers.map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.firstName} {e.lastName}
                                  {e.jobTitle ? ` · ${e.jobTitle}` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No department matched</span>
                        )}
                      </div>
                    )}

                    {/* ── Employee cards ── */}
                    <div className={cn(
                      "grid gap-3",
                      isMgr
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    )}>
                      {emps.map((emp: any) => {
                        const empDept = deptList.find((d) => d.id === emp.departmentId);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => setLocation(`/employees/${emp.id}`)}
                            className={cn(
                              "rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all group",
                              isMgr
                                ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300"
                                : "bg-white border-slate-200 hover:border-blue-200"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                                isMgr ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {(emp.firstName || "")[0]}
                                {(emp.lastName  || "")[0]}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p
                                  title={`${emp.firstName} ${emp.lastName}`}
                                  className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors"
                                >
                                  {shortName(emp.firstName, emp.lastName)}
                                </p>
                                {isMgr ? (
                                  <p className="text-xs text-amber-600 font-medium mt-0.5">Branch Manager</p>
                                ) : (
                                  <>
                                    <p className="text-xs text-slate-500 truncate">{emp.jobTitle || "—"}</p>
                                    <p className="text-xs text-slate-400 truncate">{empDept?.name || "—"}</p>
                                  </>
                                )}
                              </div>

                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${statusClasses(emp.status)}`}>
                                {emp.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  