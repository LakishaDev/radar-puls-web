import Image from "next/image";
import {cn} from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function BrandLogo({
  className,
  imageClassName,
  showWordmark = true,
  wordmarkClassName,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/images/brand/logo.svg"
        alt="Radar Puls"
        width={32}
        height={32}
        className={cn("h-8 w-8 shrink-0 rounded-md", imageClassName)}
        priority
      />
      {showWordmark && (
        <span className={cn("text-sm font-semibold uppercase tracking-[0.15em]", wordmarkClassName)}>
          Radar Puls
        </span>
      )}
    </span>
  );
}
