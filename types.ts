
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface InteractionData {
  id: string;
  type: string;
  value?: string;
  elementType: string;
  elementText: string;
  appContext: string | null;
}

export interface WorkspaceState {
  id: number;
  activeApp: AppDefinition | null;
  llmContent: string;
  interactionHistory: InteractionData[];
  currentAppPath: string[];
  isLoading: boolean;
  error: string | null;
}

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string; // Base64 data for files
  mimeType?: string;
  parentId: string | null; // null = root/desktop
  dateModified: number;
  position?: { x: number; y: number };
}
