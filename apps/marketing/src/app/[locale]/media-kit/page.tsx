"use client";

import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Download, Image as ImageIcon, Images, FileText, Palette, Camera, AlertTriangle } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";
import EmptyState from "@xc/ui/EmptyState";

const typeIcons: Record<string, React.ReactNode> = {
  logo: <Palette className="w-5 h-5" />,
  headshot: <Camera className="w-5 h-5" />,
  one_pager: <FileText className="w-5 h-5" />,
  brand_guidelines: <ImageIcon className="w-5 h-5" />,
};

const typeLabels: Record<string, string> = {
  logo: "Logo",
  headshot: "Headshot",
  one_pager: "One Pager",
  brand_guidelines: "Brand Guidelines",
};

interface MediaKitAsset {
  ID?: string;
  Name?: string;
  AssetType?: string;
  DownloadURL?: string;
}

export default function MediaKitPage() {
  const [assets, setAssets] = useState<MediaKitAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listMediaKit()
      .then((d) => { setAssets((d.assets || []) as MediaKitAsset[]); setLoading(false); })
      .catch(() => setError("Failed to load media kit"));
  }, []);

  if (error) return (
    <EmptyState
      icon={AlertTriangle}
      title="Failed to load media kit"
      description="We couldn't load the media kit right now. Please try again shortly."
    />
  );
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  const grouped = assets.reduce((acc: Record<string, MediaKitAsset[]>, asset: MediaKitAsset) => {
    const type = asset.AssetType || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {});

  return (
    <>
      <PageBanner
        icon={Images}
        eyebrow="Brand & media"
        title="Media Kit"
        description="Official brand assets for press, partners, and collaborators. Download and use in accordance with our brand guidelines."
        crumbs={[{ label: "Home", href: "/" }, { label: "Media Kit" }]}
      />
      <main className="shell-x py-16">
        <div className="mt-12 space-y-10">
        {Object.entries(grouped).map(([type, items]) => (
          <section key={type}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-4 flex items-center gap-2">
              {typeIcons[type] || <FileText className="w-5 h-5" />}
              {typeLabels[type] || type.replace("_", " ")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(items as MediaKitAsset[]).map((asset) => (
                <a
                  key={asset.ID}
                  href={asset.DownloadURL}
                  download
                  className="card-x group flex items-center gap-4 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-soft text-gravity/40 transition-colors group-hover:text-signal">
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
          <EmptyState
            icon={Images}
            title="No media assets available"
            description="Logos, brand assets, and press resources will appear here once available."
          />
        )}
      </main>
    </>
  );
}
