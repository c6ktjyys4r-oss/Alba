import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Check, AlertCircle, Loader2 } from "lucide-react";

export default function ImportData() {
  const { t } = useLanguage();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [staffData, setStaffData] = useState<any[]>([]);
  const utils = trpc.useUtils();

  const importMutation = trpc.import.importStaff.useMutation();

  // Load staff data on mount
  useEffect(() => {
    fetch('/staff_import_data.json')
      .then(res => res.json())
      .then(data => setStaffData(data))
      .catch(err => {
        console.error('Failed to load staff data:', err);
        toast.error('Failed to load staff data');
      });
  }, []);

  const handleImport = async () => {
    if (staffData.length === 0) {
      toast.error('No staff data loaded');
      return;
    }

    setImporting(true);
    try {
      const result = await importMutation.mutateAsync({ staffData });
      setResult(result);

      utils.employee.list.invalidate();
      utils.branch.list.invalidate();
      utils.department.list.invalidate();
      utils.dashboard.stats.invalidate();

      if (result.imported > 0) {
        toast.success(`✓ Imported ${result.imported} employees successfully!`);
      }
      if (result.errors.length > 0) {
        toast.error(`⚠ ${result.errors.length} errors during import`);
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title={t("import.title") || "Data Import"}
        subtitle={t("import.subtitle") || "Import staff data from Excel"}
      />

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#F0F4F2] rounded-lg border border-[#CDD8D2]">
              <Upload size={20} className="text-[#6D7B74]" />
              <div>
                <p className="font-medium text-[#3F4844]">Staff Data Ready</p>
                <p className="text-sm text-[#4A574F]">{staffData.length} records found</p>
              </div>
            </div>

            <Button 
              onClick={handleImport} 
              disabled={importing || staffData.length === 0} 
              className="w-full gap-2"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Start Import
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Check size={18} className="text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Imported: {result.imported} / {result.total}
                  </span>
                </div>

                {result.skipped > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle size={18} className="text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">
                      Skipped: {result.skipped} (already exist)
                    </span>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-900">Errors:</p>
                    <div className="bg-red-50 rounded-lg border border-red-200 p-3 max-h-48 overflow-y-auto">
                      {result.errors.map((error: string, i: number) => (
                        <p key={i} className="text-xs text-red-700 mb-1">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
