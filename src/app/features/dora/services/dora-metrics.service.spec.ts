import { describe, it, expect, beforeEach } from 'vitest';
import { DoraMetricsService } from './dora-metrics.service';
import { DeployEvent, CommitEvent, IncidentEvent } from '../models/dora.model';

describe('DoraMetricsService', () => {
  let service: DoraMetricsService;

  beforeEach(() => {
    service = new DoraMetricsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateDeploymentFrequency', () => {
    it('should count only successful deploys', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-02T00:00:00Z', success: false, service: 'api' },
        { id: 'd3', timestamp: '2024-01-03T00:00:00Z', success: true, service: 'api' },
      ];

      const result = service.calculateDeploymentFrequency(deploys, 7);

      expect(result.count).toBe(2);
      expect(result.periodDays).toBe(7);
    });

    it('should calculate deploys per day', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-02T00:00:00Z', success: true, service: 'api' },
        { id: 'd3', timestamp: '2024-01-03T00:00:00Z', success: true, service: 'api' },
        { id: 'd4', timestamp: '2024-01-04T00:00:00Z', success: true, service: 'api' },
        { id: 'd5', timestamp: '2024-01-05T00:00:00Z', success: true, service: 'api' },
        { id: 'd6', timestamp: '2024-01-06T00:00:00Z', success: true, service: 'api' },
        { id: 'd7', timestamp: '2024-01-07T00:00:00Z', success: true, service: 'api' },
      ];

      const result = service.calculateDeploymentFrequency(deploys, 7);

      expect(result.deploysPerDay).toBe(1);
    });

    it('should rate elite for on-demand deploys (>=1/day)', () => {
      const deploys: DeployEvent[] = Array.from({ length: 30 }, (_, i) => ({
        id: `d${i}`,
        timestamp: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        success: true,
        service: 'api',
      }));

      const result = service.calculateDeploymentFrequency(deploys, 30);

      expect(result.rating).toBe('elite');
    });

    it('should rate high for weekly deploys', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-08T00:00:00Z', success: true, service: 'api' },
        { id: 'd3', timestamp: '2024-01-15T00:00:00Z', success: true, service: 'api' },
        { id: 'd4', timestamp: '2024-01-22T00:00:00Z', success: true, service: 'api' },
      ];

      const result = service.calculateDeploymentFrequency(deploys, 28);

      expect(result.rating).toBe('high');
    });

    it('should rate medium for monthly deploys', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-15T00:00:00Z', success: true, service: 'api' }];

      const result = service.calculateDeploymentFrequency(deploys, 30);

      expect(result.rating).toBe('medium');
    });

    it('should rate low for infrequent deploys', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-15T00:00:00Z', success: true, service: 'api' }];

      const result = service.calculateDeploymentFrequency(deploys, 90);

      expect(result.rating).toBe('low');
    });

    it('should handle empty deploys', () => {
      const result = service.calculateDeploymentFrequency([], 30);

      expect(result.count).toBe(0);
      expect(result.deploysPerDay).toBe(0);
      expect(result.rating).toBe('low');
    });

    it('should handle zero period days', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: true, service: 'api' }];

      const result = service.calculateDeploymentFrequency(deploys, 0);

      expect(result.deploysPerDay).toBe(0);
    });
  });

  describe('calculateLeadTime', () => {
    it('should calculate lead time from earliest commit to deploy', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-02T00:00:00Z', success: true, service: 'api' }];

      const commits: CommitEvent[] = [
        { id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' },
        { id: 'c2', timestamp: '2024-01-01T12:00:00Z', deployId: 'd1', service: 'api' },
      ];

      const result = service.calculateLeadTime(deploys, commits);

      expect(result.averageHours).toBe(24);
      expect(result.medianHours).toBe(24);
      expect(result.entries).toBe(1);
    });

    it('should compute average and median across multiple deploys', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-02T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-04T00:00:00Z', success: true, service: 'api' },
      ];

      const commits: CommitEvent[] = [
        { id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' },
        { id: 'c2', timestamp: '2024-01-02T00:00:00Z', deployId: 'd2', service: 'api' },
      ];

      const result = service.calculateLeadTime(deploys, commits);

      expect(result.entries).toBe(2);
      expect(result.averageHours).toBe(36);
      expect(result.medianHours).toBe(36);
    });

    it('should skip failed deploys', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-02T00:00:00Z', success: false, service: 'api' },
        { id: 'd2', timestamp: '2024-01-03T00:00:00Z', success: true, service: 'api' },
      ];

      const commits: CommitEvent[] = [
        { id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' },
        { id: 'c2', timestamp: '2024-01-02T00:00:00Z', deployId: 'd2', service: 'api' },
      ];

      const result = service.calculateLeadTime(deploys, commits);

      expect(result.entries).toBe(1);
      expect(result.averageHours).toBe(24);
    });

    it('should skip deploys with no commits', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-02T00:00:00Z', success: true, service: 'api' }];

      const result = service.calculateLeadTime(deploys, []);

      expect(result.entries).toBe(0);
      expect(result.averageHours).toBe(0);
      expect(result.medianHours).toBe(0);
    });

    it('should rate elite for lead time under 24 hours', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-01T12:00:00Z', success: true, service: 'api' }];

      const commits: CommitEvent[] = [{ id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' }];

      const result = service.calculateLeadTime(deploys, commits);

      expect(result.rating).toBe('elite');
    });

    it('should rate high for lead time under 1 week', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-04T00:00:00Z', success: true, service: 'api' }];

      const commits: CommitEvent[] = [{ id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' }];

      const result = service.calculateLeadTime(deploys, commits);

      expect(result.rating).toBe('high');
    });

    it('should rate medium for lead time under 1 month', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-01-21T00:00:00Z', success: true, service: 'api' }];

      const commits: CommitEvent[] = [{ id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' }];

      const result = service.calculateLeadTime(deploys, commits);

      expect(result.rating).toBe('medium');
    });

    it('should rate low for lead time over 1 month', () => {
      const deploys: DeployEvent[] = [{ id: 'd1', timestamp: '2024-03-01T00:00:00Z', success: true, service: 'api' }];

      const commits: CommitEvent[] = [{ id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' }];

      const result = service.calculateLeadTime(deploys, commits);

      expect(result.rating).toBe('low');
    });

    it('should handle empty inputs', () => {
      const result = service.calculateLeadTime([], []);

      expect(result.entries).toBe(0);
      expect(result.averageHours).toBe(0);
      expect(result.medianHours).toBe(0);
    });
  });

  describe('calculateMeanTimeToRestore', () => {
    it('should calculate MTTR from resolved incidents', () => {
      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-01T02:00:00Z', service: 'api' },
        { id: 'i2', openedAt: '2024-01-05T00:00:00Z', resolvedAt: '2024-01-05T04:00:00Z', service: 'api' },
      ];

      const result = service.calculateMeanTimeToRestore(incidents);

      expect(result.averageHours).toBe(3);
      expect(result.medianHours).toBe(3);
      expect(result.incidents).toBe(2);
    });

    it('should exclude unresolved incidents', () => {
      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-01T01:00:00Z', service: 'api' },
        { id: 'i2', openedAt: '2024-01-05T00:00:00Z', resolvedAt: null, service: 'api' },
      ];

      const result = service.calculateMeanTimeToRestore(incidents);

      expect(result.incidents).toBe(1);
      expect(result.averageHours).toBe(1);
    });

    it('should rate elite for MTTR under 1 hour', () => {
      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-01T00:30:00Z', service: 'api' },
      ];

      const result = service.calculateMeanTimeToRestore(incidents);

      expect(result.rating).toBe('elite');
    });

    it('should rate high for MTTR under 24 hours', () => {
      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-01T12:00:00Z', service: 'api' },
      ];

      const result = service.calculateMeanTimeToRestore(incidents);

      expect(result.rating).toBe('high');
    });

    it('should rate medium for MTTR under 1 week', () => {
      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-03T00:00:00Z', service: 'api' },
      ];

      const result = service.calculateMeanTimeToRestore(incidents);

      expect(result.rating).toBe('medium');
    });

    it('should rate low for MTTR over 1 week', () => {
      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-15T00:00:00Z', service: 'api' },
      ];

      const result = service.calculateMeanTimeToRestore(incidents);

      expect(result.rating).toBe('low');
    });

    it('should handle empty incidents', () => {
      const result = service.calculateMeanTimeToRestore([]);

      expect(result.incidents).toBe(0);
      expect(result.averageHours).toBe(0);
      expect(result.medianHours).toBe(0);
    });

    it('should compute correct median with odd number of incidents', () => {
      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-01T00:00:00Z', resolvedAt: '2024-01-01T01:00:00Z', service: 'api' },
        { id: 'i2', openedAt: '2024-01-02T00:00:00Z', resolvedAt: '2024-01-02T03:00:00Z', service: 'api' },
        { id: 'i3', openedAt: '2024-01-03T00:00:00Z', resolvedAt: '2024-01-03T05:00:00Z', service: 'api' },
      ];

      const result = service.calculateMeanTimeToRestore(incidents);

      expect(result.medianHours).toBe(3);
      expect(result.incidents).toBe(3);
    });
  });

  describe('calculateChangeFailureRate', () => {
    it('should calculate failure rate from deploys', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-02T00:00:00Z', success: false, service: 'api' },
        { id: 'd3', timestamp: '2024-01-03T00:00:00Z', success: true, service: 'api' },
        { id: 'd4', timestamp: '2024-01-04T00:00:00Z', success: true, service: 'api' },
      ];

      const result = service.calculateChangeFailureRate(deploys);

      expect(result.totalDeploys).toBe(4);
      expect(result.failedDeploys).toBe(1);
      expect(result.rate).toBe(0.25);
    });

    it('should rate elite for CFR <= 5%', () => {
      const deploys: DeployEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `d${i}`,
        timestamp: '2024-01-01T00:00:00Z',
        success: i >= 3,
        service: 'api',
      }));

      const result = service.calculateChangeFailureRate(deploys);

      expect(result.rate).toBe(0.03);
      expect(result.rating).toBe('elite');
    });

    it('should rate high for CFR <= 10%', () => {
      const deploys: DeployEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `d${i}`,
        timestamp: '2024-01-01T00:00:00Z',
        success: i >= 8,
        service: 'api',
      }));

      const result = service.calculateChangeFailureRate(deploys);

      expect(result.rate).toBe(0.08);
      expect(result.rating).toBe('high');
    });

    it('should rate medium for CFR <= 15%', () => {
      const deploys: DeployEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `d${i}`,
        timestamp: '2024-01-01T00:00:00Z',
        success: i >= 12,
        service: 'api',
      }));

      const result = service.calculateChangeFailureRate(deploys);

      expect(result.rate).toBe(0.12);
      expect(result.rating).toBe('medium');
    });

    it('should rate low for CFR > 15%', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-02T00:00:00Z', success: false, service: 'api' },
        { id: 'd3', timestamp: '2024-01-03T00:00:00Z', success: false, service: 'api' },
        { id: 'd4', timestamp: '2024-01-04T00:00:00Z', success: true, service: 'api' },
      ];

      const result = service.calculateChangeFailureRate(deploys);

      expect(result.rate).toBe(0.5);
      expect(result.rating).toBe('low');
    });

    it('should handle empty deploys', () => {
      const result = service.calculateChangeFailureRate([]);

      expect(result.totalDeploys).toBe(0);
      expect(result.failedDeploys).toBe(0);
      expect(result.rate).toBe(0);
    });

    it('should handle all successful deploys', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-02T00:00:00Z', success: true, service: 'api' },
      ];

      const result = service.calculateChangeFailureRate(deploys);

      expect(result.rate).toBe(0);
      expect(result.rating).toBe('elite');
    });

    it('should handle all failed deploys', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-01T00:00:00Z', success: false, service: 'api' },
        { id: 'd2', timestamp: '2024-01-02T00:00:00Z', success: false, service: 'api' },
      ];

      const result = service.calculateChangeFailureRate(deploys);

      expect(result.rate).toBe(1);
      expect(result.rating).toBe('low');
    });
  });

  describe('calculateAll', () => {
    it('should compute all four metrics in one call', () => {
      const deploys: DeployEvent[] = [
        { id: 'd1', timestamp: '2024-01-02T00:00:00Z', success: true, service: 'api' },
        { id: 'd2', timestamp: '2024-01-03T00:00:00Z', success: false, service: 'api' },
        { id: 'd3', timestamp: '2024-01-04T00:00:00Z', success: true, service: 'api' },
      ];

      const commits: CommitEvent[] = [
        { id: 'c1', timestamp: '2024-01-01T00:00:00Z', deployId: 'd1', service: 'api' },
        { id: 'c2', timestamp: '2024-01-03T00:00:00Z', deployId: 'd3', service: 'api' },
      ];

      const incidents: IncidentEvent[] = [
        { id: 'i1', openedAt: '2024-01-03T00:00:00Z', resolvedAt: '2024-01-03T02:00:00Z', service: 'api' },
      ];

      const result = service.calculateAll(deploys, commits, incidents, 7);

      expect(result.deploymentFrequency).toBeDefined();
      expect(result.deploymentFrequency.count).toBe(2);

      expect(result.leadTime).toBeDefined();
      expect(result.leadTime.entries).toBe(2);

      expect(result.meanTimeToRestore).toBeDefined();
      expect(result.meanTimeToRestore.incidents).toBe(1);
      expect(result.meanTimeToRestore.averageHours).toBe(2);

      expect(result.changeFailureRate).toBeDefined();
      expect(result.changeFailureRate.totalDeploys).toBe(3);
      expect(result.changeFailureRate.failedDeploys).toBe(1);
    });

    it('should handle empty inputs for all metrics', () => {
      const result = service.calculateAll([], [], [], 30);

      expect(result.deploymentFrequency.count).toBe(0);
      expect(result.leadTime.entries).toBe(0);
      expect(result.meanTimeToRestore.incidents).toBe(0);
      expect(result.changeFailureRate.totalDeploys).toBe(0);
    });
  });
});
