"server only";

import { cache } from "react";
import {
  selfQueryServiceGetMyIdentity,
  selfQueryServiceGetMyOrganizationRole,
  selfQueryServiceListMyOrganizations,
  type V1GetMyIdentityResponse,
  type V1GetMyOrganizationRoleResponse,
  type V1ListMyOrganizationsResponse,
} from "@/lib/generated/openapi";
import { Result } from "@/domain/error";
import { handleBackendRequest } from "../client-helper";

import "../client";

export const getMyIdentity = cache(
  async (): Promise<Result<V1GetMyIdentityResponse>> => {
    const res = await handleBackendRequest<V1GetMyIdentityResponse>(
      () => selfQueryServiceGetMyIdentity({ throwOnError: true }),
    );
    if (res.success) {
      console.log("[roles] getMyIdentity ok isSystemAdmin=%s", res.data.isSystemAdmin);
    } else {
      console.warn(
        "[roles] getMyIdentity error type=%s code=%s message=%s details=%o",
        res.error.type, res.error.code, res.error.message, res.error.details,
      );
    }
    return res;
  },
);

export const listMyOrganizations = cache(
  async (): Promise<Result<V1ListMyOrganizationsResponse>> => {
    const res = await handleBackendRequest<V1ListMyOrganizationsResponse>(
      () => selfQueryServiceListMyOrganizations({ throwOnError: true }),
    );
    if (res.success) {
      const items = res.data.items ?? [];
      console.log("[roles] listMyOrganizations ok count=%d ids=%s",
        items.length, items.map((o) => o.id).filter(Boolean).join(","));
    } else {
      console.warn(
        "[roles] listMyOrganizations error type=%s code=%s message=%s details=%o",
        res.error.type, res.error.code, res.error.message, res.error.details,
      );
    }
    return res;
  },
);

export const getMyOrgRole = cache(
  async (orgId: string): Promise<Result<V1GetMyOrganizationRoleResponse>> => {
    const res = await handleBackendRequest<V1GetMyOrganizationRoleResponse>(
      () => selfQueryServiceGetMyOrganizationRole({
        path: { organizationId: orgId },
        throwOnError: true,
      }),
    );
    if (res.success) {
      console.log("[roles] getMyOrgRole orgId=%s ok admin=%s head=%s dispatcher=%s",
        orgId, res.data.isOrgAdmin, res.data.isOrgHead, res.data.isOrgDispatcher);
    } else {
      console.warn(
        "[roles] getMyOrgRole orgId=%s error type=%s code=%s message=%s details=%o",
        orgId, res.error.type, res.error.code, res.error.message, res.error.details,
      );
    }
    return res;
  },
);

export const isAdminAnywhere = cache(async (): Promise<boolean> => {
  const identity = await getMyIdentity();
  if (identity.success && identity.data.isSystemAdmin) {
    console.log("[roles] isAdminAnywhere → true (system admin)");
    return true;
  }

  const orgs = await listMyOrganizations();
  if (!orgs.success) {
    console.log("[roles] isAdminAnywhere → false (orgs fetch failed, type=%s code=%s)",
      orgs.error.type, orgs.error.code);
    return false;
  }

  const orgIds = (orgs.data.items ?? [])
    .map((o) => o.id)
    .filter((id): id is string => !!id);

  if (orgIds.length === 0) {
    console.log("[roles] isAdminAnywhere → false (no orgs)");
    return false;
  }

  const roles = await Promise.all(orgIds.map((id) => getMyOrgRole(id)));
  const decision = roles.some((r) => r.success && r.data.isOrgAdmin === true);
  console.log("[roles] isAdminAnywhere → %s (orgs checked=%d)", decision, orgIds.length);
  return decision;
});
