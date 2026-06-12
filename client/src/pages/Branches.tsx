import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building2, Users, MapPin } from "lucide-react";

const defaultBranchForm = { name:"", nameAr:"", address:"", phone:"", email:"", managerName:"", latitude:"", longitude:"", geofenceRadiusMeters:"100", geofenceEnabled:true, workStartTime:"", workEndTime:"", timezone:"Asia/Riyadh", lateGraceMinutes:"5" };
const defaultDeptForm = { name:"", nameAr:"", branchId:"", directManagerId:"" };

export default function Branches() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("branches");
  const [branchDialog, setBranchDialog] = useState(false);
  const [deptDialog, setDeptDialog] = useState(false);
  const [editBranchId, setEditBranchId] = useState<number|null>(null);
  const [editDeptId, setEditDeptId] = useState<number|null>(null);
  const [branchForm, setBranchForm] = useState({...defaultBranchForm});
  const [deptForm, setDeptForm] = useState({...defaultDeptForm});
  const [, setLocation] = useLocation();
    const utils = trpc.useUtils();

  const { data: branches = [], isLoading: loadBranches } = trpc.branch.list.useQuery();
  const { data: departments = [], isLoading: loadDepts } = trpc.department.list.useQuery();
  const { data: employees = [] } = trpc.employee.list.useQuery({});

  const createBranch = trpc.branch.create.useMutation({ onSuccess:()=>{ utils.branch.list.invalidate(); toast.success("Branch created"); setBranchDialog(false); setBranchForm({...defaultBranchForm}); }, onError:(e)=>toast.error(e.message) });
  const updateBranch = trpc.branch.update.useMutation({ onSuccess:()=>{ utils.branch.list.invalidate(); toast.success("Branch updated"); setBranchDialog(false); }, onError:(e)=>toast.error(e.message) });
  const deleteBranch = trpc.branch.delete.useMutation({ onSuccess:()=>{ utils.branch.list.invalidate(); toast.success("Branch deleted"); }, onError:(e)=>toast.error(e.message) });
  const createDept = trpc.department.create.useMutation({ onSuccess:()=>{ utils.department.list.invalidate(); toast.success("Department created"); setDeptDialog(false); setDeptForm({...defaultDeptForm}); }, onError:(e)=>toast.error(e.message) });
  const updateDept = trpc.department.update.useMutation({ onSuccess:()=>{ utils.department.list.invalidate(); toast.success("Department updated"); setDeptDialog(false); }, onError:(e)=>toast.error(e.message) });
  const deleteDept = trpc.department.delete.useMutation({ onSuccess:()=>{ utils.department.list.invalidate(); toast.success("Department deleted"); }, onError:(e)=>toast.error(e.message) });

  const openEditBranch = (b: any) => { setEditBranchId(b.id); setBranchForm({ name:b.name||"", nameAr:b.nameAr||"", address:b.address||"", phone:b.phone||"", email:b.email||"", managerName:b.managerName||"", latitude:b.latitude!=null?String(b.latitude):"", longitude:b.longitude!=null?String(b.longitude):"", geofenceRadiusMeters:b.geofenceRadiusMeters!=null?String(b.geofenceRadiusMeters):"100", geofenceEnabled:b.geofenceEnabled??true, workStartTime:b.workStartTime||"", workEndTime:b.workEndTime||"", timezone:b.timezone||"Asia/Riyadh", lateGraceMinutes:b.lateGraceMinutes!=null?String(b.lateGraceMinutes):"5" }); setBranchDialog(true); };
  const openEditDept = (d: any) => { setEditDeptId(d.id); setDeptForm({ name:d.name||"", nameAr:d.nameAr||"", branchId:d.branchId?String(d.branchId):"", directManagerId:d.directManagerId?String(d.directManagerId):"" }); setDeptDialog(true); };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation is not supported on this device"); return; }
    toast.info("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setBranchForm(f=>({ ...f, latitude:String(pos.coords.latitude), longitude:String(pos.coords.longitude) })); toast.success("Location captured"); },
      (err) => toast.error(err.message || "Could not get your location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const buildBranchPayload = () => {
    const { latitude, longitude, geofenceRadiusMeters, lateGraceMinutes, workStartTime, workEndTime, timezone, ...rest } = branchForm;
    const payload: any = { ...rest };
    payload.latitude = latitude.trim()==="" ? null : Number(latitude);
    payload.longitude = longitude.trim()==="" ? null : Number(longitude);
    if (geofenceRadiusMeters.trim()!=="") payload.geofenceRadiusMeters = Number(geofenceRadiusMeters);
    if (lateGraceMinutes.trim()!=="") payload.lateGraceMinutes = Number(lateGraceMinutes);
    payload.workStartTime = workStartTime.trim()==="" ? undefined : workStartTime;
    payload.workEndTime = workEndTime.trim()==="" ? undefined : workEndTime;
    payload.timezone = timezone.trim()==="" ? undefined : timezone;
    return payload;
  };

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("branches.title")} subtitle={`${branches.length} ${t("branches.branches")}, ${departments.length} ${t("branches.departments")}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={()=>{setEditDeptId(null);setDeptForm({...defaultDeptForm});setDeptDialog(true);}} className="gap-2"><Plus size={14}/>{t("branches.addDepartment")}</Button>
            <Button size="sm" onClick={()=>{setEditBranchId(null);setBranchForm({...defaultBranchForm});setBranchDialog(true);}} className="gap-2"><Plus size={16}/>{t("branches.addBranch")}</Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="branches" className="gap-2"><Building2 size={14}/>{t("branches.branches")}</TabsTrigger>
          <TabsTrigger value="departments" className="gap-2"><Users size={14}/>{t("branches.departments")}</TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadBranches ? Array.from({length:3}).map((_,i)=><div key={i} className="h-40 bg-slate-100 rounded-xl animate-pulse"/>) :
            branches.length===0 ? <p className="text-slate-400 col-span-3 text-center py-12">{t("common.noData")}</p> :
            branches.map(b=>{
              const empCount = employees.filter((e: any)=>e.branchId===b.id).length;
              const deptCount = departments.filter((d: any)=>d.branchId===b.id).length;
              return (
                <Card key={b.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={()=>setLocation(`/branches/${b.id}`)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Building2 size={18} className="text-blue-600"/></div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e)=>{e.stopPropagation();openEditBranch(b)}}><Edit size={13}/></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={(e)=>{e.stopPropagation();deleteBranch.mutate({id:b.id})}}><Trash2 size={13}/></Button>
                      </div>
                    </div>
                    <CardTitle className="text-base mt-2">{b.name}</CardTitle>
                    {b.nameAr && <p className="text-sm text-slate-500">{b.nameAr}</p>}
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1">
                    {b.address && <p className="text-xs text-slate-500">📍 {b.address}</p>}
                    {b.phone && <p className="text-xs text-slate-500">📞 {b.phone}</p>}
                    {b.managerName && <p className="text-xs text-slate-500">👤 {b.managerName}</p>}
                    <div className="flex gap-3 pt-2 border-t border-slate-100 mt-2">
                      <span className="text-xs text-blue-600 font-medium">{empCount} {t("employees.title")}</span>
                      <span className="text-xs text-violet-600 font-medium">{deptCount} {t("branches.departments")}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {[t("branches.departmentName"),`${t("branches.departmentName")} (AR)`,t("common.branch"),t("employees.title"),t("common.actions")].map(h=>(
                    <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadDepts ? Array.from({length:4}).map((_,i)=>(
                  <tr key={i} className="border-b border-slate-50">{Array.from({length:5}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}</tr>
                )) : departments.length===0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
                ) : departments.map((d: any)=>{
                  const branch = branches.find(b=>b.id===d.branchId);
                  const empCount = employees.filter((e: any)=>e.departmentId===d.id).length;
                  return (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                      <td className="px-4 py-3 text-slate-600">{d.nameAr||"—"}</td>
                      <td className="px-4 py-3 text-slate-600">{branch?.name||"—"}</td>
                      <td className="px-4 py-3 text-slate-600">{empCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEditDept(d)}><Edit size={13}/></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={()=>deleteDept.mutate({id:d.id})}><Trash2 size={13}/></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

            {/* Branch Dialog */}
      <Dialog open={branchDialog} onOpenChange={setBranchDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editBranchId?"Edit Branch":t("branches.addBranch")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {[{key:"name",label:t("branches.branchName"),req:true},{key:"nameAr",label:`${t("branches.branchName")} (AR)`},{key:"address",label:t("employees.address")},{key:"phone",label:t("common.phone")},{key:"email",label:t("common.email")},{key:"managerName",label:t("branches.manager")}].map(({key,label,req})=>(
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}{req&&" *"}</Label>
                <Input value={(branchForm as any)[key]} onChange={e=>setBranchForm({...branchForm,[key]:e.target.value})} className="h-8 text-sm"/>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 mt-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-slate-700">GPS Attendance</Label>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={useCurrentLocation}><MapPin size={12}/> Use current location</Button>
            </div>
            <label className="flex items-start gap-2 mb-3 text-sm text-slate-700 cursor-pointer select-none">
              <input type="checkbox" checked={branchForm.geofenceEnabled} onChange={e=>setBranchForm({...branchForm,geofenceEnabled:e.target.checked})} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
              <span>Require GPS geofence for attendance<span className="block text-[11px] text-slate-400 font-normal">Uncheck for branches without a fixed location (e.g. management / remote staff) — they can check in/out from anywhere.</span></span>
            </label>
            <div className={`grid grid-cols-2 gap-3 ${branchForm.geofenceEnabled ? "" : "opacity-50 pointer-events-none"}`}>
              <div className="space-y-1">
                <Label className="text-xs">Latitude</Label>
                <Input type="number" step="any" value={branchForm.latitude} onChange={e=>setBranchForm({...branchForm,latitude:e.target.value})} className="h-8 text-sm" placeholder="24.7136"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Longitude</Label>
                <Input type="number" step="any" value={branchForm.longitude} onChange={e=>setBranchForm({...branchForm,longitude:e.target.value})} className="h-8 text-sm" placeholder="46.6753"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Geofence radius (m)</Label>
                <Input type="number" value={branchForm.geofenceRadiusMeters} onChange={e=>setBranchForm({...branchForm,geofenceRadiusMeters:e.target.value})} className="h-8 text-sm" placeholder="100"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Late grace (min)</Label>
                <Input type="number" value={branchForm.lateGraceMinutes} onChange={e=>setBranchForm({...branchForm,lateGraceMinutes:e.target.value})} className="h-8 text-sm" placeholder="5"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Work start</Label>
                <Input type="time" value={branchForm.workStartTime} onChange={e=>setBranchForm({...branchForm,workStartTime:e.target.value})} className="h-8 text-sm"/>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Work end</Label>
                <Input type="time" value={branchForm.workEndTime} onChange={e=>setBranchForm({...branchForm,workEndTime:e.target.value})} className="h-8 text-sm"/>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Timezone</Label>
                <Input value={branchForm.timezone} onChange={e=>setBranchForm({...branchForm,timezone:e.target.value})} className="h-8 text-sm" placeholder="Asia/Riyadh"/>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">When geofence is required, employees can only check in/out within the radius of these coordinates (out-of-range punches are still logged for audit). When unchecked, location is optional and staff can punch from anywhere.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setBranchDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={()=>{ const payload=buildBranchPayload(); if(editBranchId) updateBranch.mutate({id:editBranchId,...payload}); else createBranch.mutate(payload); }} disabled={createBranch.isPending||updateBranch.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Department Dialog */}
      <Dialog open={deptDialog} onOpenChange={setDeptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editDeptId?"Edit Department":t("branches.addDepartment")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("branches.departmentName")} *</Label>
              <Input value={deptForm.name} onChange={e=>setDeptForm({...deptForm,name:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("branches.departmentName")} (AR)</Label>
              <Input value={deptForm.nameAr} onChange={e=>setDeptForm({...deptForm,nameAr:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.branch")}</Label>
              <Select value={deptForm.branchId} onValueChange={v=>setDeptForm({...deptForm,branchId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select branch"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Direct Manager</Label>
              <Select value={deptForm.directManagerId} onValueChange={v=>setDeptForm({...deptForm,directManagerId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select manager"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {employees.map((e: any)=><SelectItem key={e.id} value={String(e.id)}>{e.firstName} {e.lastName}{e.jobTitle?` · ${e.jobTitle}`:""}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-slate-400">Employees in this department see this person as their Direct Manager and requests route to them.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeptDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={()=>{ const payload: any = { name:deptForm.name, nameAr:deptForm.nameAr, branchId: deptForm.branchId && deptForm.branchId!=="none" ? Number(deptForm.branchId) : undefined, directManagerId: deptForm.directManagerId && deptForm.directManagerId!=="none" ? Number(deptForm.directManagerId) : null }; if(editDeptId) updateDept.mutate({id:editDeptId,...payload}); else createDept.mutate(payload); }} disabled={createDept.isPending||updateDept.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
