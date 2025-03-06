export const handleViewDeal = (dealUrl: string) => {
  console.log('handleViewDeal called with URL:', dealUrl);

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Track conversion for analytics
  if (typeof window.gtag_report_conversion === 'function') {
    window.gtag_report_conversion();
  }

  // Ensure the affiliate tag is present in the URL
  const affiliateId = 'ndmlabs-20'; // Hardcoded affiliate ID
  const urlWithAffiliate = ensureAffiliateTag(dealUrl, affiliateId);

  // Extract ASIN regardless of platform
  const asin = extractAsin(urlWithAffiliate);
  console.log('Extracted ASIN:', asin);

  if (isIOS) {
    try {
      // Store the time when we start the app launch attempt
      const startTime = Date.now();
      
      // Create links for both destinations
      const appLink = document.createElement('a');
      const webLink = document.createElement('a');
      
      // Setup app deep link
      if (asin) {
        // iOS Universal Link for specific product
        appLink.href = `https://www.amazon.com/dp/${asin}?tag=${affiliateId}`;
      } else {
        // Use regular URL as fallback
        appLink.href = urlWithAffiliate;
      }
      
      // Setup web fallback link
      webLink.href = urlWithAffiliate;
      
      // Set targeting for both links
      appLink.setAttribute('target', '_self');
      webLink.setAttribute('target', '_self');
      
      // Helper to check if we're still on the same page after app launch attempt
      const checkStillHere = () => {
        if (document.visibilityState !== 'hidden') {
          // We're still on the current page after our timeout, 
          // which likely means the app didn't launch
          console.log('iOS app not launched - falling back to browser after', Date.now() - startTime, 'ms');
          webLink.click();
        }
      };
      
      // Setup timer for fallback - only trigger fallback if we're still visible
      const fallbackTimer = setTimeout(checkStillHere, 2000); // 2 second timeout
      
      // Also listen for visibility changes to clear our timer if app launches
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // If the page becomes hidden, the app likely launched
          console.log('Page hidden - app probably launched');
          clearTimeout(fallbackTimer);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Fire the app link
      document.body.appendChild(appLink);
      appLink.click();
      
      // Clean up
      setTimeout(() => {
        if (document.body.contains(appLink)) document.body.removeChild(appLink);
        if (document.body.contains(webLink)) document.body.removeChild(webLink);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }, 2500);
      
    } catch (err) {
      console.error('Error with iOS deep linking:', err);
      window.location.href = urlWithAffiliate; // Direct fallback
    }
    
  } else if (isAndroid) {
    try {
      // Store current time to measure if app opens
      const startTime = Date.now();
      
      // Set up a visibility listener to detect app switching
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // Page hidden indicates app launched
          console.log('App appears to have launched on Android');
          clearTimeout(fallbackTimer);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Set up fallback timer
      const fallbackTimer = setTimeout(() => {
        if (document.visibilityState !== 'hidden') {
          console.log('Android app launch timeout after', Date.now() - startTime, 'ms - falling back to browser');
          window.location.href = urlWithAffiliate;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }, 1500); // 1.5 second timeout
      
      // Try Android intent URL
      if (asin) {
        // Intent URL for specific product
        window.location.href = `intent://www.amazon.com/dp/${asin}?tag=${affiliateId}#Intent;scheme=https;package=com.amazon.mShop.android.shopping;end`;
      } else {
        // Intent URL for general URL
        const cleanUrl = urlWithAffiliate.replace(/^https?:\/\//, '');
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.amazon.mShop.android.shopping;end`;
      }
      
    } catch (err) {
      console.error('Error with Android deep linking:', err);
      window.location.href = urlWithAffiliate; // Direct fallback
    }
    
  } else {
    // Desktop handling - always open in new tab
    window.open(urlWithAffiliate, '_blank', 'noopener,noreferrer');
  }
};

// Helper functions remain unchanged
function extractAsin(url: string): string | null {
  try {
    const amazonUrl = new URL(url);
    
    // Check if it's an Amazon URL
    if (!amazonUrl.hostname.includes('amazon.com')) {
      return null;
    }
    
    // Method 1: Extract from /dp/ path
    const dpMatch = amazonUrl.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
    if (dpMatch && dpMatch[1]) {
      return dpMatch[1];
    }
    
    // Method 2: Extract from /gp/product/ path
    const gpMatch = amazonUrl.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    if (gpMatch && gpMatch[1]) {
      return gpMatch[1];
    }
    
    // Method 3: Look for ASIN parameter
    const asinParam = amazonUrl.searchParams.get('ASIN') || amazonUrl.searchParams.get('asin');
    if (asinParam && asinParam.length === 10 && /^[A-Z0-9]{10}$/i.test(asinParam)) {
      return asinParam;
    }
    
    // Method 4: Look for any 10-character alphanumeric string in the path
    const pathParts = amazonUrl.pathname.split('/');
    for (const part of pathParts) {
      if (part && part.length === 10 && /^[A-Z0-9]{10}$/i.test(part)) {
        return part;
      }
    }
    
    return null;
  } catch (err) {
    console.error('Error extracting ASIN:', err);
    return null;
  }
}

function ensureAffiliateTag(url: string, affiliateId: string): string {
  try {
    const parsedUrl = new URL(url);
    
    // Check if it's an Amazon URL
    if (!parsedUrl.hostname.includes('amazon.com')) {
      return url;
    }
    
    // Remove any existing affiliate tags
    parsedUrl.searchParams.delete('tag');
    
    // Add our affiliate tag
    parsedUrl.searchParams.set('tag', affiliateId);
    
    return parsedUrl.toString();
  } catch (err) {
    console.error('Error adding affiliate tag:', err);
    
    // If URL parsing fails, try a simpler approach
    if (url.includes('?')) {
      // URL already has parameters
      if (url.includes('tag=')) {
        // Replace existing tag
        return url.replace(/tag=[^&]+/, `tag=${affiliateId}`);
      } else {
        // Add tag as additional parameter
        return `${url}&tag=${affiliateId}`;
      }
    } else {
      // URL has no parameters yet
      return `${url}?tag=${affiliateId}`;
    }
  }
}
