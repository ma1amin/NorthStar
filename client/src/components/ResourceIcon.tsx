import { Network } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getVerifiedLogoUrl } from "@/lib/resourceIdentity";

type ResourceIconProps = {
  logo?: string | null;
  title: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

/**
 * Displays a stored resource logo when one is available. A neutral graph mark
 * is used for unresolved assets rather than inventing or deriving a brand mark.
 */
export function ResourceIcon({ logo, title, className, imageClassName, priority = false }: ResourceIconProps) {
  const [failed, setFailed] = useState(false);
  const verifiedLogo = getVerifiedLogoUrl(logo);
  const canRenderLogo = Boolean(verifiedLogo && !failed);

  return (
    <span className={cn("ns-resource-icon", className)} aria-label={`${title} icon`}>
      {canRenderLogo ? (
        <img
          src={verifiedLogo!}
          alt={`${title} icon`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-contain", imageClassName)}
        />
      ) : (
        <Network aria-hidden="true" className="h-[52%] w-[52%]" strokeWidth={2.2} />
      )}
    </span>
  );
}
