"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Download, Image, FileText, Palette, Camera } from "lucide-react";

const typeIcons: Record<string, React.ReactNode> = {
  logo: <Palette className="w-5 h-5" />,
  headshot: <Camera className="w-5 h-5" />,
  one_pager: <FileText className="w-5 h-5" />,
  brand_guidelines: <Image className="w-5 h-5" />,
};

const typeLabels: Record<string, string> = {
  logo: "Logo",
  headshot: "Headshot",
  one_pager: "One Pager",
  brand_guidelines: "Brand Guidelines",
};

export default function MediaKitPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listMediaKit()
      .then((d) => { setAssets(d.assets || []); setLoading(false); })
      .catch(() => setError("Failed to load media kit"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  const grouped = assets.reduce((acc: Record<string, any[]>, asset: any) => {
    const type = asset.AssetType || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <h1 className="text-3xl lg:text-5xl font-bold">Media Kit</h1>
      <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
        Official brand assets for press, partners, and collaborators. Download and use in accordance with our brand guidelines.
      </p>

      <div className="mt-12 space-y-10">
        {Object.entries(grouped).map(([type, items]) => (
          <section key={type}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-4 flex items-center gap-2">
              {typeIcons[type] || <FileText className="w-5 h-5" />}
              {typeLabels[type] || type.replace("_", " ")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(items as any[]).map((asset) => (
                <a
                  key={asset.ID}
                  href={asset.DownloadURL}
                  download
                  className="flex items-center gap-4 border border-hairline rounded-lg p-4 hover:border-signal transition-colors group"
                >
                  <div className="w-10 h-10 bg-soft rounded flex items-center justify-center text-gravity/40 group-hover:text-signal transition-colors">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{asset.Name}</p>
                    <p className="text-xs text-gravity/40 capitalize">{asset.AssetType?.replace("_", " ")}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      {assets.length === 0 && (
        <p className="text-center text-gravity/40 py-12">No media kit assets available.</p>
      )}
    </main>
  );
}
