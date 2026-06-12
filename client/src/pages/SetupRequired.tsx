import { AlertTriangle, ExternalLink } from "lucide-react";
import { getDeployStatus } from "@/config";

const ENV_HINTS: Record<string, string> = {
  DATABASE_URL: "MySQL connection string (e.g., mysql://user:password@host:3306/alba)",
  JWT_SECRET: "Random secret string used to sign session cookies",
};

export default function SetupRequired() {
  const status = getDeployStatus();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-amber-100 p-3">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-slate-900">
              Alba ERP — setup required
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              The app is running, but some environment variables are missing.
              Add them in your hosting service&apos;s{" "}
              <strong>Environment</strong> settings, then redeploy.
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {status.missingEnvVars.map(name => (
            <li
              key={name}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <code className="text-sm font-semibold text-slate-900">{name}</code>
              {ENV_HINTS[name] && (
                <p className="mt-1 text-sm text-slate-600">{ENV_HINTS[name]}</p>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-6 rounded-lg bg-[#F0F4F2] px-4 py-3 text-sm text-[#3F4844]">
          <p className="font-medium">Required variables</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            <li>DATABASE_URL=mysql://user:password@host:3306/alba</li>
            <li>JWT_SECRET=your-random-secret-string</li>
          </ul>
        </div>

        <a
          href="https://dashboard.render.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#6D7B74] hover:text-[#5C6862]"
        >
          Open Render dashboard
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
