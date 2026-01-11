import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface ScrollToTopProps {
    container: HTMLElement | null;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({ container }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!container) return;

        const toggleVisibility = () => {
            if (container.scrollTop > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        container.addEventListener('scroll', toggleVisibility);

        return () => container.removeEventListener('scroll', toggleVisibility);
    }, [container]);

    const scrollToTop = () => {
        container?.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`absolute bottom-20 right-6 p-3 rounded-full bg-accent-sky text-white shadow-lg shadow-sky-200 dark:shadow-none transition-all duration-300 z-50 transform hover:scale-110 active:scale-95 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
            aria-label="Scroll to top"
        >
            <Icon name="arrow_upward" className="text-xl" />
        </button>
    );
};
