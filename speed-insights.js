/**
 * Vercel Speed Insights Configuration
 * @see https://vercel.com/docs/speed-insights/quickstart
 */

import { injectSpeedInsights } from './vendor/speed-insights.mjs';

// Initialize Speed Insights with configuration
injectSpeedInsights({
  // Enable debug mode in development (default: true)
  debug: false,
  
  // Sample rate: 1 = 100% of events sent (default: 1)
  // Set to 0.5 to send 50% of events, etc.
  sampleRate: 1,
  
  // Optional: beforeSend middleware to modify/filter events
  // beforeSend: (event) => {
  //   // Modify or return null to cancel the event
  //   return event;
  // },
});
