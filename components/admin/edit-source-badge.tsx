"use client";

import {Brain, CheckCircle2, Globe, PenLine} from "lucide-react";
import {useTranslations} from "next-intl";
import {type ComponentType} from "react";
import {cn} from "@/lib/utils";
import {type EditSource} from "@/lib/admin-api";

interface EditSourceBadgeProps {
  value: EditSource;
}

const variantMap: Record<EditSource, {className: string; Icon: ComponentType<{className?: string}>}> = {
  ai_raw: {
    className: "border-violet-500/30 bg-violet-500/20 text-violet-300",
    Icon: Brain,
  },
  admin_edited: {
    className: "border-amber-500/30 bg-amber-500/20 text-amber-300",
    Icon: PenLine,
  },
  admin_confirmed: {
    className: "border-emerald-500/30 bg-emerald-500/20 text-emerald-300",
    Icon: CheckCircle2,
  },
  web_submitted: {
    className: "border-blue-500/30 bg-blue-500/20 text-blue-300",
    Icon: Globe,
  },
};

export function EditSourceBadge({value}: EditSourceBadgeProps) {
  const t = useTranslations("admin.eventDetail.editSource");
  const variant = variantMap[value] ?? variantMap.ai_raw;
  const Icon = variant.Icon;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium", variant.className)}>
      <Icon className="h-3.5 w-3.5" />
      {t(value)}
    </span>
  );
}
