import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const AuthContext = createContext(null);

/*
 * This provider should export a `user` context state that is 
 * set (to non-null) when:
 *     1. a hard reload happens while a user is logged in.
 *     2. the user just logged in.
 * `user` should be set to null when:
 *     1. a hard reload happens when no users are logged in.
 *     2. the user just logged out.
 */
export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    // Check if token exists on mount and fetch user info
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const res = await fetch(`${BACKEND_URL}/user/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    // Token might be invalid/expired
                    localStorage.removeItem('token');
                }
            } catch (err) {
                console.error("Error checking user on mount:", err);
            }
        };

        fetchUser();
    }, []);

    /*
     * Logout the currently authenticated user.
     *
     * @remarks This function will always navigate to "/".
     */
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate("/");
    };

    /**
     * Login a user with their credentials.
     *
     * @remarks Upon success, navigates to "/profile". 
     * @param {string} username - The username of the user.
     * @param {string} password - The password of the user.
     * @returns {string} - Upon failure, Returns an error message.
     */
    const login = async (username, password) => {
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!res.ok) {
                return "Invalid username or password";
            }

            const data = await res.json();
            const token = data.token;

            // Store token in localStorage (or cookie if you prefer)
            localStorage.setItem('token', token);

            const res1 = await fetch(`${BACKEND_URL}/user/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ✅ include JWT
                }
            });

            if (!res1.ok) {
                return "Failed to fetch user info";
            }
    
            const userData = await res1.json();
            setUser(userData.user);

            navigate('/profile');
            return "Successfully Logged in."; 
        } catch (err) {
            console.error("Login error:", err);
            return "An error occurred while logging in";
        }
    };

    /**
     * Registers a new user. 
     * 
     * @remarks Upon success, navigates to "/".
     * @param {Object} userData - The data of the user to register.
     * @returns {string} - Upon failure, returns an error message.
     */
    const register = async (userData) => {
        const username = userData.username;
        const firstname = userData.firstname;
        const lastname = userData.lastname;
        const password = userData.password;

        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, firstname, lastname, password })
            });

            if (res.status === 409) {
                return "Username already exists.";
            }
    
            if (!res.ok) {
                return "Something went wrong while registering.";
            }

            const data = await res.json();
            const message = data.message;

            navigate('/success');
            return message;
        } catch {
            return "An error occurred while registering."
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
