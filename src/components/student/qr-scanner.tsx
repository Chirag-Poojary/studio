
'use client';

import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useRouter } from 'next/navigation';

const qrcodeRegionId = "html5qr-code-full-region";

export function QrScanner() {
    const router = useRouter();

    useEffect(() => {
        const html5QrcodeScanner = new Html5QrcodeScanner(
            qrcodeRegionId,
            { 
                fps: 10, 
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const qrboxSize = Math.floor(minEdge * 0.8);
                    return {
                        width: qrboxSize,
                        height: qrboxSize,
                    };
                },
                rememberLastUsedCamera: true,
            },
            /* verbose= */ false
        );

        const onScanSuccess = (decodedText: string) => {
            html5QrcodeScanner.clear().then(() => {
                // The URL validation can be more robust in a real app
                if (decodedText.includes('/attend?sessionId=')) {
                    router.push(decodedText);
                } else {
                    console.warn("Scanned QR code is not a valid attendance link:", decodedText);
                    // Optionally, show a toast message to the user about the invalid QR code
                }
            }).catch(error => {
                console.error("Failed to clear scanner.", error);
            });
        };

        const onScanFailure = (error: any) => {
            // This callback is called on every frame if no QR code is found.
            // It's best to keep this quiet to avoid console spam.
        };

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        // Cleanup function to clear the scanner on component unmount
        return () => {
            html5QrcodeScanner.clear().catch(error => {
                // This can fail if the component is unmounted before the scanner is ready.
                // It's safe to ignore this error.
                console.error("Failed to clear scanner on unmount:", error);
            });
        };
    }, [router]);

    return <div id={qrcodeRegionId} className="w-full" />;
}
