export interface DeployEvent {
  id: string;
  timestamp: string;
  success: boolean;
  service: string;
}

export interface CommitEvent {
  id: string;
  timestamp: string;
  deployId: string;
  service: string;
}

export interface IncidentEvent {
  id: string;
  openedAt: string;
  resolvedAt: string | null;
  service: string;
}

export interface DoraMetrics {
  deploymentFrequency: DeploymentFrequency;
  leadTime: LeadTime;
  meanTimeToRestore: MeanTimeToRestore;
  changeFailureRate: ChangeFailureRate;
}

export interface DeploymentFrequency {
  count: number;
  periodDays: number;
  deploysPerDay: number;
  rating: DoraRating;
}

export interface LeadTime {
  averageHours: number;
  medianHours: number;
  entries: number;
  rating: DoraRating;
}

export interface MeanTimeToRestore {
  averageHours: number;
  medianHours: number;
  incidents: number;
  rating: DoraRating;
}

export interface ChangeFailureRate {
  totalDeploys: number;
  failedDeploys: number;
  rate: number;
  rating: DoraRating;
}

export type DoraRating = 'elite' | 'high' | 'medium' | 'low';
