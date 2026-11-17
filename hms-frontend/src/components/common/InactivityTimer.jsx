import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Inactivity timeout threshold: 15 minutes (in milliseconds)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

function InactivityTimer() {
    const navigate = useNavigate();
    const lastActivityRef = useRef(Date.now());

    useEffect(() => {
        // 1. Reset timer on any active user interaction
        const resetTimer = () => {
            const now = Date.now();
            // Throttle storage update to once every 2 seconds
            if (now - lastActivityRef.current > 2000) {
                lastActivityRef.current = now;
                try {
                    localStorage.setItem('hms_last_activity', now.toString());
                } catch {
                    // Ignore storage access errors
                }
            } else {
                lastActivityRef.current = now;
            }
        };

        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));

        // 2. Periodic check for inactivity timeout
        const intervalId = setInterval(() => {
            const token = localStorage.getItem('token');
            if (!token) {
                return; // User is not logged in, no need to time out
            }

            const storedLast = localStorage.getItem('hms_last_activity');
            const lastActive = storedLast ? parseInt(storedLast, 10) : lastActivityRef.current;
            const elapsed = Date.now() - lastActive;

            if (elapsed >= INACTIVITY_TIMEOUT_MS) {
                // Clear session data
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('hms_last_activity');

                alert("⚠️ Session Timed Out: You have been automatically logged out due to 15 minutes of inactivity.");
                navigate('/');
            }
        }, 5000);

        // 3. Axios global response interceptor for 401 (expired backend JWT)
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    const token = localStorage.getItem('token');
                    if (token) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('role');
                        localStorage.removeItem('hms_last_activity');
                        alert("⚠️ Session Expired: Your authentication has expired. Please log in again.");
                        navigate('/');
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
            clearInterval(intervalId);
            axios.interceptors.response.eject(interceptor);
        };
    }, [navigate]);

    return null; // Headless component
}

export default InactivityTimer;
