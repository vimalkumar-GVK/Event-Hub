window.SmartCampus = window.SmartCampus || {};

(function (app) {
    const API_BASE = '/api';

    // --- HELPER FOR FETCH ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        try {
            console.log(`API Request: ${method} ${API_BASE}${endpoint}`);
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            if (!response.ok) {
                let errorDetail = 'API Request failed';
                try {
                    const error = await response.json();
                    errorDetail = error.detail || error.message || errorDetail;
                } catch (e) {
                    errorDetail = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorDetail);
            }
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            // If it's a TypeError, it's likely a network error (CORS, 404, etc.)
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                console.error('Network Error: Check if the API server is running and the URL is correct.');
            }
            throw error;
        }
    }

    // --- HELPER TO CONVERT SNAKE_CASE TO CAMELCASE ---
    function toCamelCase(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => toCamelCase(item));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj).reduce((result, key) => {
                const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                result[camelKey] = toCamelCase(obj[key]);
                return result;
            }, {});
        }
        return obj;
    }

    // --- REFACTORED DATA API ---
    app.Data = {
        // We still use session in memory/local storage for persistence of the login state
        getCurrentUser: () => {
            const user = localStorage.getItem('smart_campus_user');
            return user ? JSON.parse(user) : null;
        },

        // Auth
        login: async (email, password) => {
            try {
                const user = toCamelCase(await apiRequest('/login', 'POST', { email, password }));
                localStorage.setItem('smart_campus_user', JSON.stringify(user));
                return { success: true, user };
            } catch (e) {
                return { success: false, message: e.message };
            }
        },

        logout: () => {
            localStorage.removeItem('smart_campus_user');
        },

        addUser: async (userData) => {
            try {
                const user = toCamelCase(await apiRequest('/register', 'POST', userData));
                return { success: true, user };
            } catch (e) {
                return { success: false, message: e.message };
            }
        },

        // Events
        get: async () => {
            const events = toCamelCase(await apiRequest('/events'));
            const registrations = toCamelCase(await apiRequest('/registrations'));
            const users = toCamelCase(await apiRequest('/users'));
            const session = app.Data.getCurrentUser();

            return {
                events,
                registrations,
                users,
                session
            };
        },

        getUsers: async () => {
            return toCamelCase(await apiRequest('/users'));
        },

        getSystemStats: async () => {
            return toCamelCase(await apiRequest('/system/stats'));
        },

        sendSystemAnnouncement: async (text) => {
            return await apiRequest('/system/announce', 'POST', { text });
        },

        addEvent: async (eventDetails) => {
            return toCamelCase(await apiRequest('/events', 'POST', eventDetails));
        },

        updateEvent: async (eventId, eventDetails) => {
            return toCamelCase(await apiRequest(`/events/${eventId}`, 'PUT', eventDetails));
        },

        deleteEvent: async (eventId) => {
            return await apiRequest(`/events/${eventId}`, 'DELETE');
        },

        // Registrations
        registerForEvent: async (userId, eventId, subEventId = null, paymentScreenshot = null, collegeName = null) => {
            try {
                const reg = await apiRequest('/registrations', 'POST', {
                    user_id: userId,
                    event_id: eventId,
                    sub_event_id: subEventId,
                    payment_screenshot: paymentScreenshot,
                    college_name: collegeName
                });
                return { success: true, message: 'Registration successful!' };
            } catch (e) {
                return { success: false, message: e.message };
            }
        },

        updateRegistrationStatus: async (regId, status) => {
            return toCamelCase(await apiRequest(`/registrations/${regId}/status`, 'PUT', { status }));
        },

        updateAttendance: async (regId, attendance) => {
            return toCamelCase(await apiRequest(`/registrations/${regId}/attendance`, 'PUT', { attendance }));
        },

        async deleteRegistration(regId) {
            return await apiRequest(`/registrations/${regId}`, 'DELETE');
        },

        async updateCertificate(regId, certificateUrl, certificateType = 'Participation') {
            // Fetch only necessary data if possible, or just skip if we assume Present
            try {
                const reg = await apiRequest(`/registrations/id/${regId}`);
                return toCamelCase(await apiRequest(`/registrations/${regId}/attendance`, 'PUT', {
                    attendance: reg.attendance || 'Present',
                    certificate_url: certificateUrl,
                    certificate_type: certificateType
                }));
            } catch (e) {
                // Fallback if detail fetch fails
                return toCamelCase(await apiRequest(`/registrations/${regId}/attendance`, 'PUT', {
                    attendance: 'Present',
                    certificate_url: certificateUrl,
                    certificate_type: certificateType
                }));
            }
        },

        markAttendance: async (input, certificateUrl = null, certificateType = 'Participation') => {
            // input can be regId or possibly a JSON string from a QR code
            let regId = input;
            const currentUser = app.Data.getCurrentUser();

            if (typeof input === 'string' && input.startsWith('{')) {
                try {
                    const data = JSON.parse(input);

                    // Case 1: Student scanning an EVENT attendance QR
                    if (data.type === 'event_attendance' && currentUser) {
                        return toCamelCase(await apiRequest('/attendance/self-mark', 'POST', {
                            user_id: currentUser.id,
                            event_id: data.eventId,
                            attendance_code: data.code || ''
                        }));
                    }

                    // Case 2: Admin scanning a STUDENT registration QR
                    if (data.id) regId = data.id;
                    else if (data.regId) regId = data.regId;
                } catch (e) {
                    console.error('Failed to parse QR data:', e);
                }
            }

            // Standard marking by Reg ID (Default for Admin)
            return toCamelCase(await apiRequest(`/registrations/${regId}/attendance`, 'PUT', {
                attendance: 'Present',
                certificate_url: certificateUrl,
                certificate_type: certificateType
            }));
        },

        markMyAttendance: async (eventId, attendanceCode) => {
            const user = app.Data.getCurrentUser();
            if (!user) throw new Error("Not logged in");

            return toCamelCase(await apiRequest('/attendance/self-mark', 'POST', {
                user_id: user.id,
                event_id: eventId,
                attendance_code: attendanceCode
            }));
        },

        // Users
        updateUser: async (userId, userData) => {
            try {
                const user = toCamelCase(await apiRequest(`/users/${userId}`, 'PUT', userData));
                // Update local storage if it's the current user
                const current = app.Data.getCurrentUser();
                if (current && current.id === userId) {
                    localStorage.setItem('smart_campus_user', JSON.stringify({ ...current, ...user }));
                }
                return { success: true, user, message: 'Profile updated successfully!' };
            } catch (e) {
                return { success: false, message: e.message };
            }
        },

        updatePassword: async (userId, currentPassword, newPassword) => {
            try {
                await apiRequest(`/users/${userId}/password`, 'PUT', {
                    current_password: currentPassword,
                    new_password: newPassword
                });
                return { success: true, message: 'Password updated successfully!' };
            } catch (e) {
                return { success: false, message: e.message };
            }
        },

        deleteUser: async (userId) => {
            return await apiRequest(`/users/${userId}`, 'DELETE');
        },

        // Messages
        sendMessage: async (senderId, receiverId, text, attachment = null) => {
            return toCamelCase(await apiRequest('/messages', 'POST', {
                sender_id: senderId,
                receiver_id: receiverId,
                text,
                attachment
            }));
        },

        getMessagesBetween: async (userA, userB) => {
            const allMessages = toCamelCase(await apiRequest('/messages'));
            const sA = String(userA);
            const sB = String(userB);
            return allMessages.filter(m => {
                const ms = String(m.senderId);
                const mr = String(m.receiverId);
                return (ms === sA && mr === sB) || (ms === sB && mr === sA);
            });
        },

        getChatContacts: async (userId) => {
            const allMessages = toCamelCase(await apiRequest('/messages'));
            const partnerIds = new Set();
            const sid = String(userId);
            allMessages.forEach(m => {
                if (String(m.senderId) === sid) partnerIds.add(String(m.receiverId));
                if (String(m.receiverId) === sid) partnerIds.add(String(m.senderId));
            });

            const allUsers = toCamelCase(await apiRequest('/users'));
            return allUsers.filter(u => partnerIds.has(String(u.id)));
        },

        // Notifications
        addNotification: async (text, type = 'info', role = 'all', from = 'System') => {
            return toCamelCase(await apiRequest('/notifications', 'POST', {
                text,
                type,
                role,
                sender_name: from
            }));
        },

        getNotifications: async (role) => {
            const all = toCamelCase(await apiRequest('/notifications'));
            // Backend returns list of all, we filter by role
            return all.filter(n => n.role === role || n.role === 'all');
        },

        markNotificationsAsRead: async (role) => {
            return await apiRequest('/notifications/read', 'PUT', { role });
        },

        clearNotifications: async (role) => {
            return await apiRequest('/notifications', 'DELETE', { role });
        }
    };

})(window.SmartCampus);
