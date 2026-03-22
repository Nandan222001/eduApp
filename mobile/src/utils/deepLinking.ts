import * as Linking from 'expo-linking';

export interface DeepLinkRoute {
  path: string;
  params?: Record<string, string>;
}

export const DEEP_LINK_SCHEME = 'edutrack';
export const DEEP_LINK_PREFIX = `${DEEP_LINK_SCHEME}://`;
export const WEB_LINK_PREFIX = 'https://edutrack.app';

export const linkingConfig = {
  prefixes: [
    DEEP_LINK_PREFIX,
    WEB_LINK_PREFIX,
    'https://*.edutrack.app',
  ],
  config: {
    screens: {
      '(auth)': {
        screens: {
          login: 'login',
          register: 'register',
          'forgot-password': 'forgot-password',
          'reset-password': 'reset-password',
          'otp-verify': 'otp-verify',
          'otp-login': 'otp-login',
        },
      },
      '(tabs)': {
        screens: {
          student: {
            screens: {
              index: 'student',
              assignments: 'student/assignments',
              grades: 'student/grades',
              schedule: 'student/schedule',
              'homework-scanner': 'student/homework-scanner',
              'study-buddy': 'student/study-buddy',
              'ai-predictions': 'student/ai-predictions',
              profile: 'student/profile',
            },
          },
          parent: {
            screens: {
              index: 'parent',
              children: 'parent/children',
              communication: 'parent/communication',
              reports: 'parent/reports',
              profile: 'parent/profile',
            },
          },
        },
      },
      assignments: {
        path: 'assignments/:id',
        parse: {
          id: (id: string) => id,
        },
        stringify: {
          id: (id: string) => id,
        },
      },
      courses: {
        path: 'courses/:id',
        parse: {
          id: (id: string) => id,
        },
        stringify: {
          id: (id: string) => id,
        },
      },
      children: {
        path: 'children/:id',
        parse: {
          id: (id: string) => id,
        },
        stringify: {
          id: (id: string) => id,
        },
      },
      messages: {
        path: 'messages/:id',
        parse: {
          id: (id: string) => id,
        },
        stringify: {
          id: (id: string) => id,
        },
      },
      notifications: {
        path: 'notifications/:id',
        parse: {
          id: (id: string) => id,
        },
        stringify: {
          id: (id: string) => id,
        },
      },
      profile: 'profile',
      settings: 'settings',
    },
  },
};

export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const parsed = Linking.parse(url);
    
    if (!parsed.path) {
      return null;
    }

    return {
      path: parsed.path,
      params: parsed.queryParams as Record<string, string> || {},
    };
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}

export function createDeepLink(path: string, params?: Record<string, string>): string {
  const queryString = params 
    ? '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  
  return `${DEEP_LINK_PREFIX}${path}${queryString}`;
}

export function createWebLink(path: string, params?: Record<string, string>): string {
  const queryString = params 
    ? '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  
  return `${WEB_LINK_PREFIX}/${path}${queryString}`;
}

export function getInitialURL(): Promise<string | null> {
  return Linking.getInitialURL();
}

export function addDeepLinkListener(
  callback: (url: string) => void
): { remove: () => void } {
  return Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });
}

export const deepLinkRoutes = {
  assignments: (id: string) => `/assignments/${id}`,
  courses: (id: string) => `/courses/${id}`,
  children: (id: string) => `/children/${id}`,
  messages: (id: string) => `/messages/${id}`,
  notifications: (id: string) => `/notifications/${id}`,
  profile: () => '/profile',
  settings: () => '/settings',
  studentHome: () => '/(tabs)/student',
  parentHome: () => '/(tabs)/parent',
  login: () => '/(auth)/login',
  register: () => '/(auth)/register',
} as const;

export function isValidDeepLink(url: string): boolean {
  if (!url) return false;
  
  return url.startsWith(DEEP_LINK_PREFIX) || 
         url.startsWith(WEB_LINK_PREFIX) ||
         url.includes('edutrack.app');
}

export function normalizeDeepLink(url: string): string {
  if (url.startsWith(WEB_LINK_PREFIX)) {
    return url.replace(WEB_LINK_PREFIX, DEEP_LINK_PREFIX);
  }
  
  if (url.includes('edutrack.app')) {
    const path = url.split('edutrack.app')[1] || '';
    return `${DEEP_LINK_PREFIX}${path.startsWith('/') ? path.slice(1) : path}`;
  }
  
  return url;
}
