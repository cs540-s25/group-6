import React from 'react';

const FoodSkeleton = () => {
    return (
        <div style={styles.card} className="recommendation-card skeleton-card">
            <div style={styles.cardContent}>
                <div style={styles.cardLeft}>
                    <div style={{ ...styles.skeletonBox, ...styles.cardIcon }} />
                </div>
                <div style={styles.cardDetails}>
                    <div style={{ ...styles.skeletonBox, ...styles.title }} />
                    <div style={{ ...styles.skeletonBox, ...styles.meta }} />
                    <div style={{ ...styles.skeletonBox, ...styles.meta }} />
                    <div style={{ ...styles.skeletonBox, ...styles.meta }} />
                </div>
            </div>
        </div>
    );
};

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

const styles = {
    card: {
        opacity: 0.8,
    },
    cardContent: {
        display: 'flex',
        padding: '16px',
        gap: '16px',
    },
    cardLeft: {
        position: 'relative',
    },
    cardDetails: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    skeletonBox: {
        background: 'linear-gradient(90deg, #f0f0f0, #e2e2e2, #f0f0f0)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
        borderRadius: '8px',
    },
    cardIcon: {
        width: '70px',
        height: '70px',
        minWidth: '70px',
    },
    title: {
        height: '20px',
        width: '60%',
        marginBottom: '10px',
    },
    meta: {
        height: '14px',
        width: '40%',
        marginBottom: '6px',
    },
};

// Inject shimmer animation keyframes into the DOM once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-shimmer-keyframes')) {
    const style = document.createElement('style');
    style.id = 'skeleton-shimmer-keyframes';
    style.innerHTML = shimmerKeyframes;
    document.head.appendChild(style);
}

export default FoodSkeleton;
