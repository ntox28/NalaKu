import React from 'react';

const NalaKuLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        {/* Orange rounded square background */}
        <rect width="100" height="100" rx="16" ry="16" fill="#f97316" />

        {/* White Letter 'N' */}
        <path
            d="M22,80 V20 H38 L62,65 V20 H78 V80 H62 L38,35 V80 H22 Z"
            fill="white"
        />
    </svg>
);

export default NalaKuLogo;
