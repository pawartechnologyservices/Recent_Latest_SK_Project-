import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "superadmin" | "admin" | "manager" | "supervisor" | "employee" | null;

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  joinDate: string;
  site: string;
  department: string;
  contactNumber?: string;
  lastLogin?: string;
  [key: string]: any; // For any additional fields
}

interface RoleContextType {
  user: User | null;
  role: UserRole;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

// Use your actual backend URL
const API_URL = `https://${window.location.hostname}:5001/api/auth`;

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored user session on initial load
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem("sk_user");
      const storedToken = localStorage.getItem("sk_token");

      if (storedUser && storedToken) {
        // Verify token with backend
        const response = await fetch(`${API_URL}/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`
          },
          body: JSON.stringify({ token: storedToken })
        });

        if (response.ok) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setRole(parsedUser.role);
          setIsAuthenticated(true);
        } else {
          // Token invalid, clear storage
          localStorage.removeItem("sk_user");
          localStorage.removeItem("sk_token");
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, selectedRole: UserRole) => {
    try {
      console.log('🟡 Signup attempt:', { name, email, role: selectedRole });
      
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role: selectedRole
        })
      });

      const data = await response.json();
      console.log('🟡 Signup response:', data);

      if (!data.success) {
        throw new Error(data.message || 'Signup failed');
      }

      // Save user and token
      localStorage.setItem("sk_user", JSON.stringify(data.user));
      localStorage.setItem("sk_token", data.token);
      
      setUser(data.user);
      setRole(data.user.role);
      setIsAuthenticated(true);
      
      console.log('✅ Signup successful for:', data.user.email);
      
    } catch (error: any) {
      console.error('🔴 Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string, selectedRole: UserRole) => {
    try {
      console.log('🟡 Login attempt:', { 
        email, 
        role: selectedRole,
        passwordLength: password.length,
        apiUrl: API_URL 
      });
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole
        })
      });

      console.log('🟡 Response status:', response.status);
      
      const data = await response.json();
      console.log('🟡 Login response data:', data);

      if (!response.ok || !data.success) {
        console.error('🔴 Login failed:', {
          status: response.status,
          success: data.success,
          message: data.message,
          debug: data.debug
        });
        
        let errorMessage = data.message || 'Login failed';
        if (data.debug) {
          errorMessage += ` (Debug: ${JSON.stringify(data.debug)})`;
        }
        throw new Error(errorMessage);
      }

      // Save user and token
      localStorage.setItem("sk_user", JSON.stringify(data.user));
      localStorage.setItem("sk_token", data.token);
      
      setUser(data.user);
      setRole(data.user.role);
      setIsAuthenticated(true);
      
      console.log('✅ Login successful for:', data.user.email);
      
    } catch (error: any) {
      console.error('🔴 Login error details:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem("sk_user");
    localStorage.removeItem("sk_token");
    console.log('✅ User logged out');
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        role,
        login,
        signup,
        logout,
        isAuthenticated,
        loading
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
};