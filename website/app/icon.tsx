import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #a855f7 100%)', // Primary to Secondary purple colors
                    borderRadius: '8px', // Slightly rounded corners for a sleek look
                    color: 'white',
                    fontSize: '22px',
                    fontWeight: '900',
                    fontFamily: 'sans-serif',
                }}
            >
                A
            </div>
        ),
        {
            ...size,
        }
    );
}
