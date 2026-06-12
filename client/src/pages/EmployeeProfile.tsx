import { useParams } from "wouter";
  import { useState } from "react";
  import { trpc } from "@/lib/trpc";
  import { useLanguage } from "@/contexts/LanguageContext";
  import { employeeName, jobTitle as jobTitleOf, localizedName } from "@/lib/i18n";
  import { Button } from "@/components/ui/button";
  import { ChevronLeft, User2, Briefcase, DollarSign, FileText, ExternalLink, Edit2, Check, X } from "lucide-react";
  import { cn } from "@/lib/utils";

  function InfoRow({ label, value }: { label: string; value?: string|number|null }) {
    return (
      <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-slate-50 last:border-0">
        <span className="text-xs text-slate-400 self-center">{label}</span>
        <span className="text-sm font-medium text-slate-900 text-end">{value || "—"}</span>
      </div>
    );
  }

  function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="grid grid-cols-2 gap-2 py-2 border-b border-slate-50 last:border-0 items-center">
        <span className="text-xs text-slate-400">{label}</span>
        <div className="flex justify-end">{children}</div>
      </div>
    );
  }

  export default function EmployeeProfile() {
    const params = useParams<{ id: string }>();
    const { t, lang } = useLanguage();
    const empId = Number(params.id);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ jobTitle: "", branchId: 0, departmentId: 0 });

    const utils = trpc.useUtils();

    const { data: emp, isLoading } = trpc.employee.getById.useQuery({ id: empId }, { enabled: !!empId });
    const { data: salary } = trpc.payroll.getSalaryStructure.useQuery({ employeeId: empId }, { enabled: !!empId });
    const { data: documents = [] } = trpc.employee.getDocuments.useQuery({ employeeId: empId }, { enabled: !!empId });
    const { data: branches = [] } = trpc.branch.list.useQuery();
    const { data: departments = [] } = trpc.department.list.useQuery();

    const updateEmployee = trpc.employee.update.useMutation({
      onSuccess: () => {
        utils.employee.getById.invalidate({ id: empId });
        utils.employee.list.invalidate();
        setEditing(false);
      },
    });

    const openEdit = () => {
      setForm({
        jobTitle: emp?.jobTitle || "",
        branchId: emp?.branchId || 0,
        departmentId: emp?.departmentId || 0,
      });
      setEditing(true);
    };

    const saveEdit = () => {
      updateEmployee.mutate({
        id: empId,
        jobTitle: form.jobTitle || undefined,
        branchId: form.branchId || undefined,
        departmentId: form.departmentId || undefined,
      });
    };

    if (isLoading) {
      return (
        <div className="p-6 space-y-4 max-w-4xl mx-auto">
          <div className="h-5 w-20 bg-slate-100 rounded animate-pulse"/>
          <div className="h-28 bg-slate-100 rounded-2xl animate-pulse"/>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="h-60 bg-slate-100 rounded-2xl animate-pulse"/>
            <div className="h-60 bg-slate-100 rounded-2xl animate-pulse"/>
          </div>
        </div>
      );
    }

    if (!emp) return <div className="p-6 text-slate-400">Employee not found.</div>;

    const branch = (branches as any[]).find(b=>b.id===emp.branchId);
    const dept = (departments as any[]).find(d=>d.id===emp.departmentId);

    // Filter departments to selected branch when editing
    const filteredDepts = form.branchId
      ? (departments as any[]).filter(d => d.branchId === form.branchId)
      : (departments as any[]);

    const basic      = Number(salary?.basicSalary)        || 0;
    const housing    = Number(salary?.housingAllowance)    || 0;
    const transport  = Number(salary?.transportAllowance)  || 0;
    const otherAllow = Number(salary?.otherAllowances)     || 0;
    const otherDed   = Number(salary?.otherDeductions)     || 0;
    const gosiPct    = Number(salary?.taxDeduction)        || 0;
    const gosiAmt    = Math.round((basic + housing) * gosiPct) / 100;
    const net        = basic + housing + transport + otherAllow - gosiAmt - otherDed;

    const selectCls = "w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#8B9A92] text-slate-900";
    const inputCls  = "w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#8B9A92] text-slate-900";

    return (
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
        {/* Back */}
        <Button variant="ghost" size="sm" className="gap-1.5 text-slate-500 -ml-2" onClick={()=>window.history.back()}>
          <ChevronLeft size={16}/> Back
        </Button>

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#E7ECE9] flex items-center justify-center text-xl font-bold text-[#4A574F] flex-shrink-0">
            {(emp.firstName||"")[0]}{(emp.lastName||"")[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">{employeeName(lang,emp)}</h1>
            {employeeName(lang==="ar"?"en":"ar",emp) && employeeName(lang==="ar"?"en":"ar",emp) !== employeeName(lang,emp) && (
              <p className="text-slate-500 text-sm">{employeeName(lang==="ar"?"en":"ar",emp)}</p>
            )}
            <p className="text-slate-500 text-sm mt-0.5">{jobTitleOf(lang,emp)||"—"}</p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full font-medium badge-${emp.status}`}>{emp.status}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Personal Info */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <User2 size={16} className="text-[#6D7B74]"/>
              <h2 className="font-semibold text-slate-900">Personal Information</h2>
            </div>
            <InfoRow label="Email"         value={emp.email}/>
            <InfoRow label="Phone"         value={emp.phone}/>
            <InfoRow label="National ID"   value={emp.nationalId}/>
            <InfoRow label="Date of Birth" value={emp.dateOfBirth}/>
            <InfoRow label="Gender"        value={emp.gender}/>
            <InfoRow label="Nationality"   value={emp.nationality}/>
            <InfoRow label="Address"       value={emp.address}/>
          </section>

          {/* Employment Info */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-[#7C6E6C]"/>
                <h2 className="font-semibold text-slate-900">Employment Information</h2>
              </div>
              {!editing ? (
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-slate-500 hover:text-[#7C6E6C] px-2" onClick={openEdit}>
                  <Edit2 size={13}/> Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 gap-1 px-2.5 text-xs" onClick={saveEdit} disabled={updateEmployee.isPending}>
                    <Check size={12}/>
                    {updateEmployee.isPending ? "Saving…" : "Save"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={()=>setEditing(false)} disabled={updateEmployee.isPending}>
                    <X size={13}/>
                  </Button>
                </div>
              )}
            </div>

            {updateEmployee.isError && (
              <p className="text-xs text-red-500 mb-2">Failed to save. Please try again.</p>
            )}

            <InfoRow label="Employee Code" value={emp.employeeCode}/>
            <InfoRow label="Hire Date"     value={emp.hireDate}/>

            {/* Job Title — editable */}
            {!editing ? (
              <InfoRow label="Job Title" value={jobTitleOf(lang,emp)}/>
            ) : (
              <EditRow label="Job Title">
                <input
                  className={inputCls}
                  value={form.jobTitle}
                  onChange={e=>setForm(f=>({...f, jobTitle: e.target.value}))}
                  placeholder="e.g. Nurse Practitioner"
                />
              </EditRow>
            )}

            {/* Branch — editable */}
            {!editing ? (
              <InfoRow label="Branch" value={localizedName(lang,branch)}/>
            ) : (
              <EditRow label="Branch">
                <select
                  className={selectCls}
                  value={form.branchId || ""}
                  onChange={e=>{
                    const bid = Number(e.target.value);
                    setForm(f=>({...f, branchId: bid, departmentId: 0}));
                  }}
                >
                  <option value="">— Select branch —</option>
                  {(branches as any[]).map((b:any)=>(
                    <option key={b.id} value={b.id}>{localizedName(lang,b)}</option>
                  ))}
                </select>
              </EditRow>
            )}

            {/* Department — editable */}
            {!editing ? (
              <InfoRow label="Department" value={localizedName(lang,dept)}/>
            ) : (
              <EditRow label="Department">
                <select
                  className={selectCls}
                  value={form.departmentId || ""}
                  onChange={e=>setForm(f=>({...f, departmentId: Number(e.target.value)}))}
                >
                  <option value="">— Select department —</option>
                  {filteredDepts.map((d:any)=>(
                    <option key={d.id} value={d.id}>{localizedName(lang,d)}</option>
                  ))}
                </select>
              </EditRow>
            )}

            <InfoRow label="Role"   value={emp.erpRole}/>
            <InfoRow label="Status" value={emp.status}/>
          </section>
        </div>

        {/* Salary Info */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-green-500"/>
            <h2 className="font-semibold text-slate-900">Salary Information</h2>
          </div>
          {!salary ? (
            <p className="text-sm text-slate-400">No salary structure configured</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { label:"Basic Salary",        value:basic,         fmt:true,  cls:"text-slate-900" },
                { label:"Housing Allowance",   value:housing,       fmt:true,  cls:"text-green-600" },
                { label:"Transport Allowance", value:transport,     fmt:true,  cls:"text-green-600" },
                { label:"Other Allowances",    value:otherAllow,    fmt:true,  cls:"text-green-600" },
                { label:"GOSI Rate",           value:`${gosiPct}%`, fmt:false, cls:"text-slate-600" },
                { label:"GOSI Deduction",      value:gosiAmt,       fmt:true,  cls:"text-red-500"   },
                { label:"Other Deductions",    value:otherDed,      fmt:true,  cls:"text-red-500"   },
                { label:"Net Salary",          value:net,           fmt:true,  cls:"text-[#4A574F] font-bold text-base", hi:true },
              ] as any[]).map(item=>(
                <div key={item.label} className={cn("rounded-xl p-3", item.hi ? "bg-[#F0F4F2] border border-[#E0E8E4] col-span-2 md:col-span-1" : "bg-slate-50")}>
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={cn("text-sm", item.cls)}>
                    {item.fmt ? `${Number(item.value).toLocaleString()} SAR` : item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Documents */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} className="text-amber-500"/>
            <h2 className="font-semibold text-slate-900">Documents</h2>
            {(documents as any[]).length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{(documents as any[]).length}</span>
            )}
          </div>
          {(documents as any[]).length === 0 ? (
            <p className="text-sm text-slate-400">No documents available</p>
          ) : (
            <div className="space-y-2">
              {(documents as any[]).map((doc:any)=>(
                <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-[#CDD8D2] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <FileText size={14} className="text-amber-500"/>
                    </div>
                    <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                  </div>
                  <ExternalLink size={13} className="text-slate-400 group-hover:text-[#6D7B74] transition-colors"/>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }
  