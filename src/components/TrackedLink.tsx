'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/ga';
import type { GAEventName, GAEventParams } from '@/lib/ga';

type Props = React.ComponentProps<typeof Link> & {
  gaEvent: GAEventName;
  gaParams?: GAEventParams;
};

export default function TrackedLink({ gaEvent, gaParams, onClick, ...rest }: Props) {
  return (
    <Link
      {...rest}
      onClick={(e) => {
        trackEvent(gaEvent, gaParams);
        onClick?.(e);
      }}
    />
  );
}
