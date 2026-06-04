import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Edit, AlertTriangle, ArrowUpDown, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Medical","Dental","Office","Cleaning","Equipment","Other"];
const TX_TYPES = ["stock_in","stock_out","transfer_in","transfer_out","adjustment"];

const defaultItemForm = { name:"", nameAr:"", itemCode:"", category:"Medical", unit:"", branchId:"", quantity:"0", minimumStock:"5", unitCost:"", description:"" };
const defaultTxForm = { itemId:"", type:"stock_in", quantity:"", fromBranchId:"", toBranchId:"", notes:"", reference:"" };

export default function Inventory() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("items");
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [txDialog, setTxDialog] = useState(false);
  const [editItemId, setEditItemId] = useState<number|null>(null);
  const [itemForm, setItemForm] = useState({...defaultItemForm});
  const [txForm, setTxForm] = useState({...defaultTxForm});
  const utils = trpc.useUtils();

  const { data: items = [], isLoading } = trpc.inventory.list.useQuery({ search:search||undefined, branchId:branchFilter?Number(branchFilter):undefined, lowStock:lowStockOnly||undefined });
  const { data: transactions = [] } = trpc.inventory.transactions.useQuery({});
  const { data: branches = [] } = trpc.branch.list.useQuery();

  const createItem = trpc.inventory.create.useMutation({ onSuccess:()=>{ utils.inventory.list.invalidate(); toast.success("Item created"); setItemDialog(false); setItemForm({...defaultItemForm}); }, onError:(e)=>toast.error(e.message) });
  const updateItem = trpc.inventory.update.useMutation({ onSuccess:()=>{ utils.inventory.list.invalidate(); toast.success("Item updated"); setItemDialog(false); }, onError:(e)=>toast.error(e.message) });
  const stockTx = trpc.inventory.stockTransaction.useMutation({ onSuccess:()=>{ utils.inventory.list.invalidate(); utils.inventory.transactions.invalidate(); toast.success("Transaction recorded"); setTxDialog(false); setTxForm({...defaultTxForm}); }, onError:(e)=>toast.error(e.message) });

  const openEdit = (item: any) => { setEditItemId(item.id); setItemForm({ name:item.name||"", nameAr:item.nameAr||"", itemCode:item.itemCode||"", category:item.category||"Medical", unit:item.unit||"", branchId:item.branchId?String(item.branchId):"", quantity:String(item.quantity||0), minimumStock:String(item.minimumStock||5), unitCost:item.unitCost?String(item.unitCost):"", description:item.description||"" }); setItemDialog(true); };

  const handleItemSubmit = () => {
    const payload: any = { ...itemForm, branchId:itemForm.branchId?Number(itemForm.branchId):undefined, quantity:Number(itemForm.quantity), minimumStock:Number(itemForm.minimumStock), unitCost:itemForm.unitCost?Number(itemForm.unitCost):undefined };
    if (editItemId) updateItem.mutate({ id:editItemId, ...payload });
    else createItem.mutate(payload);
  };

  const lowStockItems = items.filter((i: any) => Number(i.quantity) <= Number(i.minimumStock));

  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={t("inventory.title")} subtitle={`${items.length} ${t("common.items")}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={()=>{setTxForm({...defaultTxForm});setTxDialog(true);}} className="gap-2"><ArrowUpDown size={14}/>{t("inventory.transaction")}</Button>
            <Button size="sm" onClick={()=>{setEditItemId(null);setItemForm({...defaultItemForm});setItemDialog(true);}} className="gap-2"><Plus size={16}/>{t("inventory.addItem")}</Button>
          </div>
        }
      />

      {lowStockItems.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm text-amber-700">
          <AlertTriangle size={16}/>
          <span>{lowStockItems.length} {t("inventory.lowStockAlert")}: {lowStockItems.slice(0,3).map((i: any)=>i.name).join(", ")}{lowStockItems.length>3?`...+${lowStockItems.length-3}`:""}</span>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="items" className="gap-2"><Package size={14}/>{t("inventory.items")}</TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2"><ArrowUpDown size={14}/>{t("inventory.transactions")}</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Input placeholder={t("common.search")} value={search} onChange={e=>setSearch(e.target.value)} className="h-9 text-sm"/>
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder={t("common.branch")}/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={lowStockOnly?"default":"outline"} size="sm" className="h-9" onClick={()=>setLowStockOnly(!lowStockOnly)}>
              <AlertTriangle size={14} className="me-1"/>{t("inventory.lowStock")}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {[t("inventory.itemName"),t("inventory.itemCode"),t("inventory.category"),t("common.branch"),t("inventory.quantity"),t("inventory.minStock"),t("inventory.unitCost"),t("common.actions")].map(h=>(
                      <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? Array.from({length:5}).map((_,i)=>(
                    <tr key={i} className="border-b border-slate-50">{Array.from({length:8}).map((_,j)=><td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}</tr>
                  )) : items.length===0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
                  ) : items.map((item: any)=>{
                    const branch = branches.find(b=>b.id===item.branchId);
                    const isLow = Number(item.quantity) <= Number(item.minimumStock);
                    return (
                      <tr key={item.id} className={cn("border-b border-slate-50 hover:bg-slate-50 transition-colors", isLow&&"bg-amber-50/50")}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isLow && <AlertTriangle size={13} className="text-amber-500 flex-shrink-0"/>}
                            <span className="font-medium text-slate-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.itemCode||"—"}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{item.category||"—"}</span></td>
                        <td className="px-4 py-3 text-slate-600">{branch?.name||"—"}</td>
                        <td className={cn("px-4 py-3 font-semibold", isLow?"text-red-600":"text-slate-900")}>{Number(item.quantity)} {item.unit||""}</td>
                        <td className="px-4 py-3 text-slate-500">{Number(item.minimumStock)}</td>
                        <td className="px-4 py-3 text-slate-600">{item.unitCost?`${Number(item.unitCost).toLocaleString()} ${t("common.currency")}`:"—"}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={()=>openEdit(item)}><Edit size={13}/></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {[t("inventory.itemName"),t("inventory.txType"),t("inventory.quantity"),t("inventory.fromBranch"),t("inventory.toBranch"),t("common.notes"),t("common.date")].map(h=>(
                      <th key={h} className="text-start px-4 py-3 font-medium text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length===0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">{t("common.noData")}</td></tr>
                  ) : transactions.map((tx: any)=>{
                    const item = items.find((i: any)=>i.id===tx.itemId);
                    const fromBranch = branches.find(b=>b.id===tx.fromBranchId);
                    const toBranch = branches.find(b=>b.id===tx.toBranchId);
                    return (
                      <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{item?.name||`Item #${tx.itemId}`}</td>
                        <td className="px-4 py-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tx.type==="stock_in"||tx.type==="transfer_in"?"bg-green-50 text-green-700":"bg-red-50 text-red-700")}>{tx.type.replace("_"," ")}</span></td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{tx.quantity}</td>
                        <td className="px-4 py-3 text-slate-600">{fromBranch?.name||"—"}</td>
                        <td className="px-4 py-3 text-slate-600">{toBranch?.name||"—"}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{tx.notes||"—"}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{tx.createdAt?new Date(tx.createdAt).toLocaleDateString():"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Item Dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItemId?"Edit Item":t("inventory.addItem")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {[{key:"name",label:t("inventory.itemName"),req:true},{key:"nameAr",label:`${t("inventory.itemName")} (AR)`},{key:"itemCode",label:t("inventory.itemCode")},{key:"unit",label:t("inventory.unit")}].map(({key,label,req})=>(
              <div key={key} className="space-y-1">
                <Label className="text-xs">{label}{req&&" *"}</Label>
                <Input value={(itemForm as any)[key]} onChange={e=>setItemForm({...itemForm,[key]:e.target.value})} className="h-8 text-sm"/>
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">{t("inventory.category")}</Label>
              <Select value={itemForm.category} onValueChange={v=>setItemForm({...itemForm,category:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("common.branch")}</Label>
              <Select value={itemForm.branchId} onValueChange={v=>setItemForm({...itemForm,branchId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..."/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("inventory.quantity")}</Label>
              <Input type="number" value={itemForm.quantity} onChange={e=>setItemForm({...itemForm,quantity:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("inventory.minStock")}</Label>
              <Input type="number" value={itemForm.minimumStock} onChange={e=>setItemForm({...itemForm,minimumStock:e.target.value})} className="h-8 text-sm"/>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">{t("inventory.unitCost")}</Label>
              <Input type="number" value={itemForm.unitCost} onChange={e=>setItemForm({...itemForm,unitCost:e.target.value})} className="h-8 text-sm"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setItemDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleItemSubmit} disabled={createItem.isPending||updateItem.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={txDialog} onOpenChange={setTxDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t("inventory.transaction")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("inventory.itemName")} *</Label>
              <Select value={txForm.itemId} onValueChange={v=>setTxForm({...txForm,itemId:v})}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select item"/></SelectTrigger>
                <SelectContent>{items.map((i: any)=><SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("inventory.txType")} *</Label>
                <Select value={txForm.type} onValueChange={v=>setTxForm({...txForm,type:v})}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue/></SelectTrigger>
                  <SelectContent>{TX_TYPES.map(t=><SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("inventory.quantity")} *</Label>
                <Input type="number" value={txForm.quantity} onChange={e=>setTxForm({...txForm,quantity:e.target.value})} className="h-8 text-sm"/>
              </div>
            </div>
            {(txForm.type==="transfer_in"||txForm.type==="transfer_out") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t("inventory.fromBranch")}</Label>
                  <Select value={txForm.fromBranchId} onValueChange={v=>setTxForm({...txForm,fromBranchId:v})}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="From..."/></SelectTrigger>
                    <SelectContent>{branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("inventory.toBranch")}</Label>
                  <Select value={txForm.toBranchId} onValueChange={v=>setTxForm({...txForm,toBranchId:v})}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="To..."/></SelectTrigger>
                    <SelectContent>{branches.map(b=><SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">{t("common.notes")}</Label>
              <Textarea value={txForm.notes} onChange={e=>setTxForm({...txForm,notes:e.target.value})} rows={2} className="text-sm resize-none"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setTxDialog(false)}>{t("common.cancel")}</Button>
            <Button onClick={()=>stockTx.mutate({ itemId:Number(txForm.itemId), type:txForm.type as any, quantity:Number(txForm.quantity), fromBranchId:txForm.fromBranchId?Number(txForm.fromBranchId):undefined, toBranchId:txForm.toBranchId?Number(txForm.toBranchId):undefined, notes:txForm.notes||undefined })} disabled={!txForm.itemId||!txForm.quantity||stockTx.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
