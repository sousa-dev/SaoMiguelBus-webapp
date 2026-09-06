import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui';
import { buildJourneySteps, isJourneyStepHighlighted } from '@/features/minibus/lib/journeySteps';
import { cn } from '@/lib/cn';
import type { MinibusJourney } from '@/lib/types';

/** The numbered step list, always built from the same steps the map's markers use. */
export function MinibusDirectionsSteps({
  journey,
  highlightedStepKey,
  onStepPress,
}: {
  journey: MinibusJourney;
  highlightedStepKey: string | null;
  onStepPress: (stepKey: string) => void;
}) {
  const { t } = useTranslation();
  const steps = useMemo(() => buildJourneySteps(journey, t), [journey, t]);

  return (
    <Card className="flex flex-col divide-y divide-border overflow-hidden">
      {steps.map((step) => {
        const pressable = step.kind !== 'ride' && step.coordinate != null;
        const highlighted = isJourneyStepHighlighted(step.key, highlightedStepKey, steps);
        const badgeColor = step.kind === 'transfer' ? '#6366f1' : step.accent;

        const content = (
          <div className="flex items-start gap-3 p-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-[#111]"
              style={badgeColor ? { backgroundColor: badgeColor } : undefined}
            >
              {step.stepNumber}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-content">{step.label}</p>
              <p className="text-sm text-muted">{step.detail}</p>
            </div>
          </div>
        );

        return pressable ? (
          <button
            key={step.key}
            type="button"
            onClick={() => onStepPress(step.key)}
            className={cn('text-left hover:bg-surface-variant', highlighted && 'bg-surface-variant')}
          >
            {content}
          </button>
        ) : (
          <div key={step.key}>{content}</div>
        );
      })}
    </Card>
  );
}
