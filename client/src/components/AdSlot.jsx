import React from 'react';
import { config } from '../config.js';
import { useAppStore } from '../store/useAppStore.js';

/**
 * AdSlot placeholder component (Phase 3 preparation).
 * - Fixed min-height to prevent cumulative layout shift (CLS).
 * - Reads config.ads.enabled.
 * - Hidden while a test is actively running.
 * - Renders nothing visible yet when ads are disabled.
 *
 * @param {object} props
 * @param {string} props.id Unique ad unit identifier (e.g. 'result-bottom', 'sidebar')
 * @param {string} [props.size='300x250'] Format width x height
 */
export function AdSlot({ id = 'ad-slot', size = '300x250' }){
  const testStatus = useAppStore((s) => s.testStatus);

  // Parse height from size e.g. '300x250' or default to 90px / 250px
  let minHeight = 90;
  if (size && size.includes('x')) {
    const parts = size.split('x');
    const parsedH = parseInt(parts[1], 10);
    if (!isNaN(parsedH)) minHeight = parsedH;
  }

  // Hide completely while a test is active
  if (testStatus === 'running') {
    return null;
  }

  // If ads are disabled in config, reserve the height or collapse with zero layout shift
  if (!config.ads?.enabled) {
    return (
      <div
        id={`ad-slot-${id}`}
        className="ad-slot-placeholder"
        style={{ minHeight: `${minHeight}px`, width: '100%', opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      id={`ad-slot-${id}`}
      className="ad-slot"
      style={{ minHeight: `${minHeight}px`, width: '100%' }}
    >
      {/* Google AdSense or ad provider tag mounts here */}
    </div>
  );
}

