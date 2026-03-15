import { useState, useEffect } from 'react';
import { OnboardingFlow, OnboardingProgress, UserRole } from '@/types/onboarding';
import onboardingApi from '@/api/onboarding';

export function useOnboarding(userId: string, role?: UserRole) {
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      loadFlows();
    }
  }, [role]);

  useEffect(() => {
    if (currentFlow) {
      loadProgress();
    }
  }, [currentFlow, userId]);

  const loadFlows = async () => {
    if (!role) return;

    try {
      setLoading(true);
      const data = await onboardingApi.getFlowsByRole(role);
      const activeFlows = data.filter((f) => f.isActive);
      setFlows(activeFlows);

      if (activeFlows.length > 0) {
        setCurrentFlow(activeFlows[0]);
      }
    } catch (err) {
      setError('Failed to load onboarding flows');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!currentFlow) return;

    try {
      const userProgress = await onboardingApi.getUserProgress(userId, currentFlow.id);
      setProgress(userProgress);
    } catch (err) {
      setError('Failed to load progress');
      console.error(err);
    }
  };

  const startOnboarding = async (flowId: string) => {
    const flow = flows.find((f) => f.id === flowId);
    if (flow) {
      setCurrentFlow(flow);
    }
  };

  const shouldShowOnboarding = () => {
    if (!progress || !currentFlow) return false;
    return progress.status !== 'completed';
  };

  return {
    flows,
    currentFlow,
    progress,
    loading,
    error,
    startOnboarding,
    shouldShowOnboarding,
    refreshProgress: loadProgress,
  };
}
