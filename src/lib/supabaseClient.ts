import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    timestamp: new Date().toISOString()
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'robot-vacuum-price@1.0.0'
    }
  }
});

// Initialize connection and set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  const logContext = {
    event,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    location: window.location.pathname,
    sessionExists: !!session,
    userId: session?.user?.id,
    userRole: session?.user?.role,
    metadata: session?.user?.user_metadata,
    aud: session?.user?.aud,
    accessToken: session?.access_token ? 'present' : 'missing'
  };

  console.log('Auth state changed:', logContext);
  
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    console.log('User signed out, clearing local storage', {
      ...logContext,
      storageKeys: Object.keys(localStorage)
        .filter(key => key.startsWith('supabase'))
    });
    localStorage.removeItem('supabase.auth.token');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in:', {
      ...logContext,
      lastSignIn: session?.user?.last_sign_in_at,
      expiresAt: session?.expires_at
    });
  }
});

// Add connection health check
export const checkSupabaseConnection = async () => {
  const logContext = {
    timestamp: new Date().toISOString(),
    location: window.location.pathname,
    userAgent: navigator.userAgent
  };

  try {
    // First check auth connection
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth connection test failed:', {
        ...logContext,
        error: authError,
        errorCode: authError.code,
        errorMessage: authError.message
      });
      return false;
    }

    console.log('Auth connection test successful:', {
      ...logContext,
      hasSession: !!session,
      userId: session?.user?.id
    });

    // Then check database connection
    const { data, error: dbError } = await supabase.from('robot_vacuums').select('count').limit(1);
    
    if (dbError) {
      console.error('Database connection test failed:', {
        ...logContext,
        error: dbError,
        errorCode: dbError.code,
        errorMessage: dbError.message,
        errorDetails: dbError.details
      });
      return false;
    }

    console.log('Database connection test successful', {
      ...logContext,
      hasData: !!data
    });

    return true;
  } catch (err) {
    console.error('Connection test error:', {
      ...logContext,
      error: err,
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack
    });
    return false;
  }
};

// Add admin check function
export const checkAdminAccess = async () => {
  const logContext = {
    timestamp: new Date().toISOString(),
    location: window.location.pathname,
    userAgent: navigator.userAgent
  };

  try {
    // First check connection
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.error('Admin check failed: No database connection', logContext);
      return false;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('Admin access denied: No active session', {
        ...logContext,
        sessionState: 'missing'
      });
      return false;
    }

    // Log session details before admin check
    console.log('Session found during admin check:', {
      ...logContext,
      userId: session.user.id,
      userRole: session.user.role,
      metadata: session.user.user_metadata,
      expiresAt: session.expires_at,
      accessToken: session.access_token ? 'present' : 'missing'
    });

    // First try to check admin role directly from metadata
    const isAdminFromMetadata = session.user.user_metadata?.role === 'admin';
    console.log('Checking admin role from metadata:', {
      ...logContext,
      isAdminFromMetadata,
      metadata: session.user.user_metadata
    });

    // Then try the RPC call
    const { data, error } = await supabase.rpc('is_admin');
    
    if (error) {
      console.error('Admin access check failed:', {
        ...logContext,
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        userId: session.user.id
      });
      
      // Fall back to metadata check if RPC fails
      return isAdminFromMetadata;
    }

    const isAdmin = !!data;
    console.log('Admin access check complete:', {
      ...logContext,
      isAdmin,
      isAdminFromMetadata,
      userId: session.user.id,
      userRole: session.user.role
    });

    // Return true if either check passes
    return isAdmin || isAdminFromMetadata;
  } catch (err) {
    console.error('Admin access check error:', {
      ...logContext,
      error: err,
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack
    });
    return false;
  }
};

// Add sign in function
export const signInWithPassword = async (password: string) => {
  const logContext = {
    timestamp: new Date().toISOString(),
    location: window.location.pathname,
    userAgent: navigator.userAgent
  };

  try {
    console.log('Attempting sign in:', logContext);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com', // Default admin email
      password
    });

    if (error) {
      console.error('Sign in failed:', {
        ...logContext,
        error,
        errorCode: error.code,
        errorMessage: error.message
      });
      throw error;
    }

    console.log('Sign in successful:', {
      ...logContext,
      userId: data.user?.id,
      userRole: data.user?.role,
      metadata: data.user?.user_metadata
    });

    return data;
  } catch (err) {
    console.error('Sign in error:', {
      ...logContext,
      error: err,
      errorName: err.name,
      errorMessage: err.message,
      errorStack: err.stack
    });
    throw err;
  }
};

// Function to create admin user
export const createAdminUser = async () => {
  const logContext = {
    timestamp: new Date().toISOString(),
    location: window.location.pathname
  };

  try {
    console.log('Creating admin user:', logContext);

    const { data, error } = await supabase.auth.signUp({
      email: 'admin@example.com',
      password: 'admin123',
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (error) {
      console.error('Admin user creation failed:', {
        ...logContext,
        error,
        errorCode: error.code,
        errorMessage: error.message
      });
      throw error;
    }

    console.log('Admin user created successfully:', {
      ...logContext,
      userId: data.user?.id
    });

    return data;
  } catch (err) {
    console.error('Admin user creation error:', {
      ...logContext,
      error: err,
      errorName: err.name,
      errorMessage: err.message
    });
    throw err;
  }
};
