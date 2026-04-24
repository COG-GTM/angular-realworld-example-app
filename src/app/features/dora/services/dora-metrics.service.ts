import { Injectable } from '@angular/core';
import {
  DeployEvent,
  CommitEvent,
  IncidentEvent,
  DoraMetrics,
  DeploymentFrequency,
  LeadTime,
  MeanTimeToRestore,
  ChangeFailureRate,
  DoraRating,
} from '../models/dora.model';

@Injectable({ providedIn: 'root' })
export class DoraMetricsService {
  calculateAll(
    deploys: DeployEvent[],
    commits: CommitEvent[],
    incidents: IncidentEvent[],
    periodDays: number,
  ): DoraMetrics {
    return {
      deploymentFrequency: this.calculateDeploymentFrequency(deploys, periodDays),
      leadTime: this.calculateLeadTime(deploys, commits),
      meanTimeToRestore: this.calculateMeanTimeToRestore(incidents),
      changeFailureRate: this.calculateChangeFailureRate(deploys),
    };
  }

  calculateDeploymentFrequency(deploys: DeployEvent[], periodDays: number): DeploymentFrequency {
    const successfulDeploys = deploys.filter(d => d.success);
    const count = successfulDeploys.length;
    const deploysPerDay = periodDays > 0 ? count / periodDays : 0;

    return {
      count,
      periodDays,
      deploysPerDay,
      rating: this.rateDeploymentFrequency(deploysPerDay),
    };
  }

  calculateLeadTime(deploys: DeployEvent[], commits: CommitEvent[]): LeadTime {
    const commitsByDeploy = new Map<string, CommitEvent[]>();
    for (const commit of commits) {
      const existing = commitsByDeploy.get(commit.deployId) ?? [];
      existing.push(commit);
      commitsByDeploy.set(commit.deployId, existing);
    }

    const leadTimesMs: number[] = [];

    for (const deploy of deploys) {
      if (!deploy.success) {
        continue;
      }

      const deployCommits = commitsByDeploy.get(deploy.id);
      if (!deployCommits || deployCommits.length === 0) {
        continue;
      }

      const earliestCommit = deployCommits.reduce((earliest, c) =>
        new Date(c.timestamp).getTime() < new Date(earliest.timestamp).getTime() ? c : earliest,
      );

      const leadTimeMs = new Date(deploy.timestamp).getTime() - new Date(earliestCommit.timestamp).getTime();
      if (leadTimeMs >= 0) {
        leadTimesMs.push(leadTimeMs);
      }
    }

    const averageHours = this.averageMs(leadTimesMs);
    const medianHours = this.medianMs(leadTimesMs);

    return {
      averageHours,
      medianHours,
      entries: leadTimesMs.length,
      rating: this.rateLeadTime(medianHours),
    };
  }

  calculateMeanTimeToRestore(incidents: IncidentEvent[]): MeanTimeToRestore {
    const resolvedIncidents = incidents.filter(
      (i): i is IncidentEvent & { resolvedAt: string } => i.resolvedAt !== null,
    );

    const restoreTimesMs = resolvedIncidents.map(
      i => new Date(i.resolvedAt).getTime() - new Date(i.openedAt).getTime(),
    );

    const validRestoreTimes = restoreTimesMs.filter(t => t >= 0);

    const averageHours = this.averageMs(validRestoreTimes);
    const medianHours = this.medianMs(validRestoreTimes);

    return {
      averageHours,
      medianHours,
      incidents: validRestoreTimes.length,
      rating: this.rateMTTR(medianHours),
    };
  }

  calculateChangeFailureRate(deploys: DeployEvent[]): ChangeFailureRate {
    const totalDeploys = deploys.length;
    const failedDeploys = deploys.filter(d => !d.success).length;
    const rate = totalDeploys > 0 ? failedDeploys / totalDeploys : 0;

    return {
      totalDeploys,
      failedDeploys,
      rate,
      rating: this.rateChangeFailureRate(rate),
    };
  }

  private rateDeploymentFrequency(deploysPerDay: number): DoraRating {
    if (deploysPerDay >= 1) {
      return 'elite';
    }
    if (deploysPerDay >= 1 / 7) {
      return 'high';
    }
    if (deploysPerDay >= 1 / 30) {
      return 'medium';
    }
    return 'low';
  }

  private rateLeadTime(medianHours: number): DoraRating {
    if (medianHours <= 24) {
      return 'elite';
    }
    if (medianHours <= 168) {
      return 'high';
    }
    if (medianHours <= 720) {
      return 'medium';
    }
    return 'low';
  }

  private rateMTTR(medianHours: number): DoraRating {
    if (medianHours <= 1) {
      return 'elite';
    }
    if (medianHours <= 24) {
      return 'high';
    }
    if (medianHours <= 168) {
      return 'medium';
    }
    return 'low';
  }

  private rateChangeFailureRate(rate: number): DoraRating {
    if (rate <= 0.05) {
      return 'elite';
    }
    if (rate <= 0.1) {
      return 'high';
    }
    if (rate <= 0.15) {
      return 'medium';
    }
    return 'low';
  }

  private averageMs(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length / (1000 * 60 * 60);
  }

  private medianMs(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianMs = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return medianMs / (1000 * 60 * 60);
  }
}
