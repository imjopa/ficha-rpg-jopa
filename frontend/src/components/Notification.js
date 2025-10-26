import React, { useEffect } from 'react';
import '../styles/Notification.css';

const Notification = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [onClose, duration]);

    return (
        <div className={`notification ${type}`}>
            <div className="notification-content">
                <span className="notification-message">{message}</span>
                <button className="notification-close" onClick={onClose}>
                    ×
                </button>
            </div>
        </div>
    );
};

export default Notification;
