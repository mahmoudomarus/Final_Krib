// Extend the existing window.google type
interface GoogleSignIn {
  accounts: {
    id: {
      initialize: (config: any) => void;
      prompt: () => void;
      renderButton: (element: HTMLElement, config: any) => void;
      disableAutoSelect: () => void;
    };
  };
}

interface GoogleAuthConfig {
  client_id: string;
  callback: (response: any) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
}

interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  width?: number;
  logo_alignment?: 'left' | 'center';
}

export class GoogleAuth {
  private static instance: GoogleAuth;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GoogleAuth {
    if (!GoogleAuth.instance) {
      GoogleAuth.instance = new GoogleAuth();
    }
    return GoogleAuth.instance;
  }

  async loadGoogleAuth(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).google?.accounts?.id) {
        this.isLoaded = true;
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Auth library'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  async initialize(config: GoogleAuthConfig): Promise<void> {
    await this.loadGoogleAuth();
    
    if (!(window as any).google?.accounts?.id) {
      throw new Error('Google Auth library not available');
    }

    // Disable auto-select first to ensure fresh login
    (window as any).google.accounts.id.disableAutoSelect();

    (window as any).google.accounts.id.initialize({
      client_id: config.client_id,
      callback: config.callback,
      auto_select: config.auto_select || false,
      cancel_on_tap_outside: config.cancel_on_tap_outside !== false,
      context: config.context || 'signin',
      ux_mode: 'popup', // Use popup mode for better UX
      use_fedcm_for_prompt: false, // Disable FedCM for compatibility
    });
  }

  renderButton(element: HTMLElement, config: GoogleButtonConfig = {}): void {
    if (!(window as any).google?.accounts?.id) {
      throw new Error('Google Auth not initialized');
    }

    const defaultConfig: GoogleButtonConfig = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 300,
      logo_alignment: 'left',
      ...config,
    };

    (window as any).google.accounts.id.renderButton(element, defaultConfig);
  }

  prompt(): void {
    if (!(window as any).google?.accounts?.id) {
      throw new Error('Google Auth not initialized');
    }
    
    // Clear any previous state
    (window as any).google.accounts.id.disableAutoSelect();
    
    // Show the One Tap prompt
    (window as any).google.accounts.id.prompt((notification: any) => {
      console.log('Google prompt notification:', notification);
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('Google One Tap not displayed, user may need to click the button');
      }
    });
  }

  disableAutoSelect(): void {
    if (!(window as any).google?.accounts?.id) {
      return;
    }
    (window as any).google.accounts.id.disableAutoSelect();
  }
}

export default GoogleAuth; 