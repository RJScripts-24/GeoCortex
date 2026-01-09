import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SAMPLE_LOCATIONS = [
    {
        id: 'google-hq',
        name: 'Google HQ',
        address: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
        description: 'Mountain View, CA'
    },
    {
        id: 'sf-downtown',
        name: 'SF Downtown',
        address: '345 Spear St, San Francisco, CA 94105',
        description: 'San Francisco, CA'
    },
    {
        id: 'austin',
        name: 'Austin',
        address: '500 W 2nd St, Austin, TX 78701',
        description: 'Austin, TX'
    }
];

const CinematicPreview = ({ targetAddress, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [videoUri, setVideoUri] = useState(null);
    const [error, setError] = useState(null);
    const [isFallbackMode, setIsFallbackMode] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(targetAddress);

    useEffect(() => {
        if (targetAddress) {
            // Reset state when prop changes
            setCurrentAddress(targetAddress);
            setVideoUri(null);
            setError(null);
            setIsFallbackMode(false);
            lookupVideo(targetAddress);
        }
    }, [targetAddress]);

    const lookupVideo = async (address) => {
        setLoading(true);
        setError(null);
        setVideoUri(null);

        try {
            // Use backend proxy to avoid exposure and handle CORS/Auth
            const response = await axios.get(
                `/api/aerial_view`,
                {
                    params: {
                        address: address
                    }
                }
            );

            const { state, metadata, uris } = response.data;

            if (state === 'ACTIVE' && uris) {
                // Prefer High capability MP4, then Medium
                const uri = uris.MP4_HIGH?.landscapeUri || uris.MP4_MEDIUM?.landscapeUri || uris.MP4_LOW?.landscapeUri;
                if (uri) {
                    setVideoUri(uri);
                    setIsFallbackMode(false);
                } else {
                    // Active but no compatible URI found (rare)
                    setIsFallbackMode(true);
                }
            } else {
                // PROCESSING or FAILED or State not found
                setIsFallbackMode(true);
            }

        } catch (err) {
            console.error("Aerial View Lookup Error:", err);
            // 404 means video not found -> Fallback mode
            // Other errors might be network/key related, but for user experience we show fallback or error
            if (err.response && err.response.status === 404) {
                setIsFallbackMode(true);
            } else {
                setError(err.message || "Failed to connect to Aerial View API");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSampleClick = (sampleAddress) => {
        setCurrentAddress(sampleAddress);
        setIsFallbackMode(false); // Reset fallback mode to try loading the sample
        lookupVideo(sampleAddress);
    };

    return (
        <div className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/50 font-sans">
            {/* Header / Title Area */}
            <div className="p-5 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                            Cinematic Aerial View
                        </h2>
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[300px] block" title={currentAddress}>
                            {currentAddress || "No location selected"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="relative w-full aspect-video bg-black group">

                {/* Loading State */}
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 z-20 backdrop-blur-sm">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-gray-200 border-t-cyan-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-cyan-600 text-xs font-bold">AI</span>
                            </div>
                        </div>
                        <p className="mt-4 text-slate-600 font-semibold tracking-wide animate-pulse">Scanning Satellite Data...</p>
                    </div>
                )}

                {/* Video Player */}
                {!loading && videoUri && (
                    <video
                        src={videoUri}
                        className="w-full h-full object-cover shadow-inner"
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                )}

                {/* Fallback Mode: Coverage Missing */}
                {!loading && isFallbackMode && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-gray-50 to-white">
                        <div className="mb-6 rounded-full bg-red-50 p-4 border border-red-100 shadow-sm animate-in fade-in zoom-in duration-300">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Coverage Missing</h3>
                        <p className="text-slate-500 mb-8 max-w-md">
                            Google hasn't processed 3D video for this specific location yet. <br />Select a live sample below to preview the technology:
                        </p>

                        {/* Sample Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
                            {SAMPLE_LOCATIONS.map((loc) => (
                                <button
                                    key={loc.id}
                                    onClick={() => handleSampleClick(loc.address)}
                                    className="flex flex-col items-center p-3 rounded-xl bg-white hover:bg-cyan-50/50 border border-gray-200 hover:border-cyan-200 shadow-sm hover:shadow-md transition-all duration-300 group/card text-left transform hover:-translate-y-1"
                                >
                                    <div className="w-full h-24 mb-3 rounded-lg overflow-hidden bg-gray-100 relative shadow-inner">
                                        {/* Abstract Gradient Placeholder for Thumbnail */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${loc.id === 'google-hq' ? 'from-blue-500 to-cyan-400' :
                                                loc.id === 'sf-downtown' ? 'from-indigo-500 to-purple-400' :
                                                    'from-amber-400 to-orange-400'
                                            } opacity-90 group-hover/card:opacity-100 transition-opacity`}></div>
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/20 backdrop-blur-md rounded text-[10px] uppercase font-bold text-white tracking-wider">Demo</div>
                                    </div>
                                    <div className="w-full">
                                        <div className="font-bold text-slate-700 group-hover/card:text-cyan-700 transition-colors text-sm">{loc.name}</div>
                                        <div className="text-xs text-slate-400 font-medium">{loc.description}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error State (Non-404) */}
                {!loading && error && !isFallbackMode && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-10 text-center p-6 backdrop-blur-sm">
                        <div className="mb-4 p-4 bg-red-50 rounded-full">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Connection Error</h3>
                        <p className="text-slate-500 mb-6">{error}</p>
                        <button
                            onClick={() => lookupVideo(currentAddress)}
                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-xl"
                        >
                            Retry Connection
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CinematicPreview;
