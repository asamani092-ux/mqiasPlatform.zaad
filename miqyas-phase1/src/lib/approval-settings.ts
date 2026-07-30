import { getSetting } from "@/lib/settings";

export async function getApprovalDelegationFlags() {
  const sectionHeadDelegation = (await getSetting("section_head_can_approve")) === "1";
  const deptManagerDelegation = (await getSetting("dept_manager_can_approve")) === "1";
  return { sectionHeadDelegation, deptManagerDelegation };
}
