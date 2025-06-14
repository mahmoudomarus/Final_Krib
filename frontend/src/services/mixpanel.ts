interface MixpanelConfig {
  token: string;
  debug?: boolean;
  track_pageview?: boolean;
  persistence?: string;
}

class MixpanelService {
  private initialized = false;
  private config: MixpanelConfig;

  constructor(config: MixpanelConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.initialized || typeof window === 'undefined') {
      return;
    }

    return new Promise((resolve, reject) => {
      // Check if Mixpanel is already loaded
      if (window.mixpanel && typeof window.mixpanel.init === 'function') {
        try {
          window.mixpanel.init(this.config.token, {
            debug: this.config.debug || false,
            track_pageview: this.config.track_pageview || false,
            persistence: this.config.persistence || 'localStorage'
          });
          this.initialized = true;
          console.log('✅ Mixpanel already loaded and initialized successfully');
          resolve();
        } catch (error) {
          console.error('❌ Mixpanel initialization error:', error);
          reject(error);
        }
        return;
      }

      // Use the official Mixpanel snippet approach
      const mixpanelSnippet = `
        (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");for(h=0;h<l.length;h++)c(e,l[h]);a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
      `;

      try {
        // Execute the Mixpanel snippet
        eval(mixpanelSnippet);
        
        // Initialize Mixpanel
        if (window.mixpanel && typeof window.mixpanel.init === 'function') {
          window.mixpanel.init(this.config.token, {
            debug: this.config.debug || false,
            track_pageview: this.config.track_pageview || false,
            persistence: this.config.persistence || 'localStorage'
          });
          this.initialized = true;
          console.log('✅ Mixpanel initialized successfully via snippet');
          resolve();
        } else {
          // Fallback to manual script loading
          this.loadScriptFallback().then(resolve).catch(reject);
        }
      } catch (error) {
        console.warn('⚠️ Mixpanel snippet failed, trying fallback:', error);
        this.loadScriptFallback().then(resolve).catch(reject);
      }
    });
  }

  private loadScriptFallback(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
      script.async = true;
      
      script.onload = () => {
        setTimeout(() => {
          try {
            if (window.mixpanel && typeof window.mixpanel.init === 'function') {
              window.mixpanel.init(this.config.token, {
                debug: this.config.debug || false,
                track_pageview: this.config.track_pageview || false,
                persistence: this.config.persistence || 'localStorage'
              });
              this.initialized = true;
              console.log('✅ Mixpanel loaded via fallback script');
              resolve();
            } else {
              console.warn('⚠️ Mixpanel library still not available, continuing without analytics');
              resolve(); // Don't reject, just continue without analytics
            }
          } catch (error) {
            console.warn('⚠️ Mixpanel fallback failed, continuing without analytics:', error);
            resolve(); // Don't reject, just continue without analytics
          }
        }, 200);
      };

      script.onerror = () => {
        console.warn('⚠️ Failed to load Mixpanel script, continuing without analytics');
        resolve(); // Don't reject, just continue without analytics
      };

      document.head.appendChild(script);
    });
  }

  track(eventName: string, properties?: any): void {
    try {
      if (window.mixpanel && typeof window.mixpanel.track === 'function') {
        window.mixpanel.track(eventName, {
          ...properties,
          timestamp: new Date().toISOString(),
          platform: 'web'
        });
      } else if (!this.initialized) {
        // Silently skip tracking if not initialized (avoid console spam)
        return;
      }
    } catch (error) {
      // Silently handle errors to avoid console spam
      return;
    }
  }

  identify(userId: string, properties?: any): void {
    try {
      if (window.mixpanel && typeof window.mixpanel.identify === 'function') {
        window.mixpanel.identify(userId);
        if (properties && typeof window.mixpanel.people?.set === 'function') {
          window.mixpanel.people.set(properties);
        }
      }
    } catch (error) {
      // Silently handle errors
      return;
    }
  }

  reset(): void {
    try {
      if (window.mixpanel && typeof window.mixpanel.reset === 'function') {
        window.mixpanel.reset();
      }
    } catch (error) {
      // Silently handle errors
      return;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Global Mixpanel type declaration
declare global {
  interface Window {
    mixpanel: any;
  }
}

// Create and export singleton instance
export const mixpanelService = new MixpanelService({
  token: '226aac3ae30245f406bd2a548b810fe4',
  debug: process.env.NODE_ENV === 'development',
  track_pageview: false,
  persistence: 'localStorage'
});

export default mixpanelService; 