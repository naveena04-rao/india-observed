import type { SafeFetchedSource } from "../types";

export type ConnectorStatus = "available" | "credential_required" | "unavailable";
export interface ConnectorManifest {
  id: string;
  label: string;
  status: ConnectorStatus;
  productionEnabled: false;
  credential?: string;
  quotaOrCost: string;
  accessNotes: string;
  geography: string;
  languages: string;
  retryPolicy: string;
  retainedData: string;
}
export interface DiscoveryConnector {
  manifest: ConnectorManifest;
  fetch(input: {
    url: string;
    etag?: string | null;
    lastModified?: string | null;
  }): Promise<SafeFetchedSource>;
}
