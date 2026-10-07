import type { MeasurementDomain } from "@prisma/client";

export type KpiFeedFlags = {
  feedsStrategic: boolean;
  isGovernanceRequirement: boolean;
};

/** اشتقاق domain للتوافق مع المسارات القديمة — O(1) */
export function deriveDomainFromFlags(opts: {
  type: "STRATEGIC" | "OPERATIONAL";
  feedsStrategic: boolean;
  isGovernanceRequirement: boolean;
}): MeasurementDomain {
  if (opts.type === "OPERATIONAL") return "OPERATIONAL";
  if (opts.isGovernanceRequirement && !opts.feedsStrategic) return "GOVERNANCE";
  return "STRATEGIC";
}

/** تطبيع الوسوم من الجسم أو من domain القديم — O(1) */
export function resolveFeedFlags(input: {
  type: "STRATEGIC" | "OPERATIONAL";
  feedsStrategic?: boolean | null;
  isGovernanceRequirement?: boolean | null;
  domain?: MeasurementDomain | null;
}): KpiFeedFlags & { domain: MeasurementDomain } {
  let feedsStrategic = input.feedsStrategic;
  let isGovernanceRequirement = input.isGovernanceRequirement;

  if (feedsStrategic == null || isGovernanceRequirement == null) {
    if (input.domain === "GOVERNANCE") {
      feedsStrategic = feedsStrategic ?? false;
      isGovernanceRequirement = isGovernanceRequirement ?? true;
    } else if (input.type === "OPERATIONAL" || input.domain === "OPERATIONAL") {
      feedsStrategic = feedsStrategic ?? false;
      isGovernanceRequirement = isGovernanceRequirement ?? false;
    } else {
      feedsStrategic = feedsStrategic ?? true;
      isGovernanceRequirement = isGovernanceRequirement ?? false;
    }
  }

  const flags: KpiFeedFlags = {
    feedsStrategic: Boolean(feedsStrategic),
    isGovernanceRequirement: Boolean(isGovernanceRequirement),
  };

  // تشغيلي لا يغذي الاستراتيجية افتراضياً
  if (input.type === "OPERATIONAL") {
    flags.feedsStrategic = false;
  }

  // يجب وسم واحد على الأقل للمؤشرات غير التشغيلية
  if (input.type !== "OPERATIONAL" && !flags.feedsStrategic && !flags.isGovernanceRequirement) {
    flags.feedsStrategic = true;
  }

  return {
    ...flags,
    domain: deriveDomainFromFlags({ type: input.type, ...flags }),
  };
}
