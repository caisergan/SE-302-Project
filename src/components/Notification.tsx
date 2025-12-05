import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface NotificationProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        // Timer to start exit animation
        const timer = setTimeout(() => {
            setIsLeaving(true);
        }, 2700);

        // Timer to actually close (remove from DOM)
        const closeTimer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearTimeout(closeTimer);
        };
    }, [onClose]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(onClose, 300);
    };

    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-emerald-50' : 'bg-red-50';
    const borderColor = isSuccess ? 'border-emerald-200' : 'border-red-200';
    const textColor = isSuccess ? 'text-emerald-800' : 'text-red-800';
    const iconColor = isSuccess ? 'text-emerald-500' : 'text-red-500';

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border ${bgColor} ${borderColor} ${textColor} transition-all duration-300 transform ${isVisible && !isLeaving ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
                } max-w-sm w-full md:w-auto`}
            role="alert"
        >
            <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                {isSuccess ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1 mr-2 text-sm font-medium">
                {message}
            </div>
            <button
                onClick={handleClose}
                className={`shrink-0 p-0.5 rounded-full hover:bg-black/5 transition-colors ${textColor} opacity-60 hover:opacity-100`}
            >
                <X size={16} />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 transition-all duration-[3000ms] ease-linear w-full origin-left"
                style={{
                    width: isVisible ? '0%' : '100%',
                    transitionProperty: 'width',
                    transitionDuration: '3000ms',
                    transitionTimingFunction: 'linear'
                }}
            />
        </div>
    );
};
