import { useEffect, useState } from 'react';
import { UserRole } from '@/types/onboarding';
import { useOnboarding } from '@/hooks/useOnboarding';
import OnboardingWizard from './OnboardingWizard';

interface OnboardingTriggerProps {
  userId: string;
  role: UserRole;
  autoStart?: boolean;
  onComplete?: () => void;
}

export default function OnboardingTrigger({
  userId,
  role,
  autoStart = true,
  onComplete,
}: OnboardingTriggerProps) {
  const { currentFlow, shouldShowOnboarding, loading } = useOnboarding(userId, role);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!loading && autoStart && shouldShowOnboarding()) {
      setShowWizard(true);
    }
  }, [loading, autoStart, shouldShowOnboarding]);

  if (loading || !currentFlow || !showWizard) {
    return null;
  }

  return (
    <OnboardingWizard
      flow={currentFlow}
      userId={userId}
      onComplete={() => {
        setShowWizard(false);
        if (onComplete) {
          onComplete();
        }
      }}
      onExit={() => setShowWizard(false)}
    />
  );
}
