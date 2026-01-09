import React from 'react';

const GestureInstructionsPopup = ({ onClose }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
            }}
            onClick={onClose}
        >
            <div
                className="animate-in fade-in zoom-in duration-300"
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '480px',
                    width: '90%',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '2.5rem', marginRight: '12px' }}>🖐️</span>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                            Gesture Controls
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                            Use hand gestures to control the map
                        </p>
                    </div>
                </div>

                {/* Instructions List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    {/* Closed Fist */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                        border: '1px solid #fed7aa'
                    }}>
                        <span style={{ fontSize: '2rem', marginRight: '16px' }}>✊</span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#c2410c', fontSize: '1rem' }}>
                                Closed Fist
                            </div>
                            <div style={{ color: '#9a3412', fontSize: '0.875rem' }}>
                                Switch to Thermal X-Ray Mode
                            </div>
                        </div>
                    </div>

                    {/* Pointing Up */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #bbf7d0'
                    }}>
                        <span style={{ fontSize: '2rem', marginRight: '16px' }}>☝️</span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#15803d', fontSize: '1rem' }}>
                                Pointing Up
                            </div>
                            <div style={{ color: '#166534', fontSize: '0.875rem' }}>
                                Switch to Satellite Mode
                            </div>
                        </div>
                    </div>

                    {/* Open Palm */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        border: '1px solid #fde68a'
                    }}>
                        <span style={{ fontSize: '2rem', marginRight: '16px' }}>🖐️</span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#b45309', fontSize: '1rem' }}>
                                Open Palm
                            </div>
                            <div style={{ color: '#92400e', fontSize: '0.875rem' }}>
                                Pause Movement
                            </div>
                        </div>
                    </div>
                </div>

                {/* Camera Note */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    marginBottom: '24px'
                }}>
                    <span style={{ fontSize: '1.25rem', marginRight: '12px' }}>📷</span>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                        Camera access is required for gesture controls. Look for the preview in the bottom-left corner.
                    </p>
                </div>

                {/* Close Button */}
                <button
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
                    }}
                    onClick={onClose}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.02)';
                        e.target.style.boxShadow = '0 6px 20px rgba(6, 182, 212, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 14px rgba(6, 182, 212, 0.4)';
                    }}
                >
                    Got it, Let's Start!
                </button>
            </div>
        </div>
    );
};

export default GestureInstructionsPopup;
