/**
 * Base Icons - Lightweight icons for initial load
 * Does NOT import the 16MB cloud library
 * Used by pages that don't need cloud-specific icons
 */

import React from 'react';
import { IconType } from '../../types';

// Export only the lightweight built-in icons (no cloud library)
export const BASE_ICONS: Record<string, React.ReactNode> = {
    // Common Icons
    [IconType.User]: <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />,
    [IconType.Database]: <path d="M12 3C7.03 3 3 5.36 3 8.25v7.5C3 18.64 7.03 21 12 21s9-2.36 9-5.25v-7.5C21 5.36 16.97 3 12 3zm0 16c-3.87 0-7-1.79-7-4v-1.52c1.22.86 3.89 1.52 7 1.52s5.78-.66 7-1.52V15c0 2.21-3.13 4-7 4zm0-6c-3.87 0-7-1.79-7-4s3.13-4 7-4 7 1.79 7 4-3.13 4-7 4z" />,
    [IconType.Api]: <path d="M19.4 6.6a.6.6 0 00-.6-.6h-1.6V4.4c0-.2-.2-.4-.4-.4h-1.6a.4.4 0 00-.4.4v1.6H8.2V4.4c0-.2-.2-.4-.4-.4H6.2a.4.4 0 00-.4.4v1.6H4.2a.6.6 0 00-.6.6v1.6c0 .2.2.4.4.4h1.6v6.8H4.2c-.2 0-.4.2-.4.4v1.6c0 .2.2.4.4.4h1.6v1.6c0 .2.2.4.4.4h1.6c0 .2.2.4.4.4v-1.6h6.8v1.6c0 .2.2.4.4.4h1.6a.4.4 0 00-.4-.4v-1.6h1.6c.2 0 .4-.2.4-.4v-1.6a.6.6 0 00-.4-.4h-1.6V8.6h1.6c.2 0 .4-.2.4-.4V6.6zM14 15.4H9.8V8.6H14v6.8z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.LoadBalancer]: <path d="M20 18H4v-2h16v2zm0-5H4V9h16v4zm0-7H4V4h16v2z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.Cloud]: <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />,
    [IconType.WebServer]: <path d="M20 15v-2h-2V7h2V5h-4V3h-2v2h-4V3H8v2H4v2h2v6H4v2H2v2h2v-2h2v2h12v-2h2v2h2v-2h-2zm-4-2H8V7h8v6z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.Firewall]: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />,
    [IconType.Cache]: <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8 2h8V3h-8v8zm2-6h4v4h-4V5zM3 21h8v-8H3v8zm2-6h4v4H5v-2z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.Mobile]: <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />,
    [IconType.WebApp]: <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 14H5V8h14v10z" />,
    [IconType.Generic]: <path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h4.17l-3.24 3.24 1.41 1.42L9 13h2v2l-4.66 4.66 1.42 1.41L11 17.83V22h2v-4.17l3.24 3.24 1.42-1.41L13 15v-2h2l4.66 4.66 1.41-1.42L17.83 13H22z" fillRule="evenodd" clipRule="evenodd" />,

    // UI Icons (stroked)
    [IconType.Edit]: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" fill="none" />,
    [IconType.FileCode]: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" fill="none" />,
    [IconType.Playground]: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" stroke="currentColor" fill="none" />,
    [IconType.Message]: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" fill="none" />,

    // AI/Tech Icons
    [IconType.Brain]: <path d="M9 8c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2H9z m-2 3H5v2h2v-2z m12 0h-2v2h2v-2z M12 4c-1.1 0-2 .9-2 2v2h4V6c0-1.1-.9-2-2-2z m0 14c1.1 0 2-.9 2-2v-2h-4v2c0 1.1.9 2 2 2z" />,
    [IconType.Gemini]: <path d="M12 2l2.12 7.88L22 12l-7.88 2.12L12 22l-2.12-7.88L2 12l7.88-2.12L12 2z" fill="#8E44AD" />,

    // Cloud Provider Icons
    [IconType.AwsApiGateway]: <path d="M12 22.75L2.8 17.58V6.42L12 1.25l9.2 5.17v11.16L12 22.75Zm-7.2-6.24L12 20.55l7.2-4.04v-9.01L12 3.46L4.8 7.5v9.01Z M12 6.5l4 2v7l-4 2l-4-2v-7l4-2Zm2 3l-2-1l-2 1v4l2 1l2-1V9.5Z" fill="#8C4FFF" />,
    [IconType.AwsEc2]: <path d="M17.4 3.79L12 0L6.6 3.79L1.2 7.58V15.17L6.6 18.96L12 22.75L17.4 18.96L22.8 15.17V7.58L17.4 3.79ZM12 4.21l5.4 3.37l-5.4 3.37L6.6 7.58L12 4.21Zm-6.6 13.92V10.55l5.4 3.37v7.58L5.4 18.13ZM18.6 18.13l-5.4 3.37v-7.58l5.4-3.37v7.58Z" fill="#FF9900" />,
    [IconType.AwsLambda]: <path d="M12 22.75L2.8 17.58V6.42L12 1.25l9.2 5.17v11.16L12 22.75Zm-7.2-6.24L12 20.55l7.2-4.04v-9.01L12 3.46L4.8 7.5v9.01Z M14.5 13.5l1.5-1.5l-3.5-3.5L14 7l-5 5H6v2h2l4 4l2.5-2.5l-1.5-1.5l-2.5 2.5l-3-3Z" fill="#FF9900" />,
    [IconType.AwsS3]: <g><path d="M12 22.75L2.8 17.58V6.42L12 1.25l9.2 5.17v11.16L12 22.75ZM4.8 16.51L12 20.55l7.2-4.04v-9.01L12 3.46L4.8 7.5v9.01Z" fill="#3F8624" /><path d="M12 18.55l-5.6-3.15v-6.8l5.6 3.15v6.8Z" fill="#52933C" /><path d="M12 18.55l5.6-3.15v-6.8l-5.6 3.15v6.8Z" fill="#246415" /><path d="M12 5.46L6.4 8.61l5.6 3.15l5.6-3.15L12 5.46Z" fill="#3F8624" /></g>,
    [IconType.AwsRds]: <g><path d="M12 22.75L2.8 17.58V6.42L12 1.25l9.2 5.17v11.16L12 22.75ZM4.8 16.51L12 20.55l7.2-4.04v-9.01L12 3.46L4.8 7.5v9.01Z" fill="#3B48CC" /><path d="M12 20.55V11.72l7.2-4.22v9.01L12 20.55Z" fill="#2E27AD" /><path d="M12 11.72L4.8 7.5l7.2-4.04l7.2 4.04L12 11.72Z" fill="#5261DD" /></g>,
    [IconType.AwsLoadBalancer]: <path d="M12 1.25L2.8 6.42v11.16L12 22.75l9.2-5.17V6.42L12 1.25Zm0 2.21l7.2 4.04v9.01L12 20.55L4.8 16.51V7.5L12 3.46Z M7 9h2v6H7V9Zm4 0h2v6h-2V9Zm4 0h2v6h-2V9Z" fill="#8C4FFF" />,
    [IconType.AwsDynamoDb]: <path d="M12 1.25L2.8 6.42v11.16L12 22.75l9.2-5.17V6.42L12 1.25Z M12 18l-5-2.5v-2l5 2.5 5-2.5v2L12 18Zm0-3l-5-2.5v-2l5 2.5 5-2.5v2L12 15Zm0-3l-5-2.5v-2l5 2.5 5-2.5v2L12 12Zm0-3L7 6.5V6l5-2.5 5 2.5v.5L12 9Z" fill="#3B48CC" />,

    // Azure
    [IconType.AzureVm]: <path d="M2 11.5L8.5 2l6.5 9.5l-6.5 9.5L2 11.5z M22 11.5L15.5 21l-6.5-9.5l6.5-9.5L22 11.5z" fill="#0078D4" />,
    [IconType.AzureBlobStorage]: <g fill="#0078D4"><path d="M12 2c5.52 0 10 2.24 10 5s-4.48 5-10 5s-10-2.24-10-5S6.48 2 12 2z" /><path d="M2 12c0 2.76 4.48 5 10 5s10-2.24 10-5v-3c0 2.76-4.48 5-10 5S2 11.76 2 9v3z" /><path d="M2 17c0 2.76 4.48 5 10 5s10-2.24 10-5v-3c0 2.76-4.48 5-10 5S2 16.76 2 14v3z" /></g>,

    // GCP
    [IconType.GcpComputeEngine]: <path d="M12 2L3 7v10l9 5l9-5V7L12 2z m5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="#4285F4" />,
    [IconType.GcpCloudStorage]: <path d="M22 6H2v5h20V6z M2 13h20v5H2v-5z" fill="#4285F4" />,

    // Container/K8s
    [IconType.Kubernetes]: <path d="M12 2l8 4.5V10l-8 4.5L4 10V6.5L12 2zm-1 8.5v3.3l-5-2.8v-3.3l5 2.8z m2 0l5-2.8v3.3l-5 2.8v-3.3zM12 16.5l5-2.8v3.3l-5 2.8v-3.3z" fillRule="evenodd" clipRule="evenodd" fill="#326CE5" />,
    [IconType.Docker]: <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.19 2.58 7.78 6.2 9.25.13.03.26 0 .38-.06.12-.06.22-.16.27-.28.05-.12.05-.25.01-.38a.5.5 0 00-.36-.37c-.12-.05-2.82-.9-2.82-3.23h5.21v-1.5H5.69c0-2.34 2.7-3.18 2.82-3.23a.5.5 0 00.37-.36c.13-.13.12-.3-.02-.42-.13-.13-.3-.12-.42.02-1.03.4-3.17 1.4-3.17 4.98h-1.5c.01-5.05 4.02-9.25 9-9.25s8.99 4.2 9 9.25h-1.5c0-3.58-2.14-4.58-3.17-4.98-.12-.05-.29-.04-.42.02-.14.12-.15.3-.02.42.05.12.15.22.27.28.12.05 2.82.9 2.82 3.23H13v1.5h5.31c0 2.34-2.7 3.18-2.82-3.23a.5.5 0 00-.37.36c-.13-.13-.12.3.02.42.13.13.3.12.42-.02 1.03-.4 3.17-1.4 3.17-4.98h-1.5z" fill="#2496ED" />,

    // Misc
    [IconType.Monitoring]: <path d="M16 4H8C6.9 4 6 4.9 6 6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 14H9V8h6v10z M7 18v-2h10v2H7z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.Logging]: <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM8 17H4v-2h4v2zm0-4H4v-2h4v2zm8 4h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4H4V7h16v2z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.Kafka]: <path d="M10 9.1L6 5v14l4-4.1V9.1z m8 5.8l4 4V5l-4 4.1v5.8z m-2-5.8L12 5v14l4-4.1V9.1z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.MessageQueue]: <path d="M4 9h16v2H4zm0 4h10v2H4z M4 5h16v2H4z M16 13h4v6h-4v-6z" fillRule="evenodd" clipRule="evenodd" />,
    [IconType.AuthService]: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v2h-2zm0 4h2v6h-2z" fill="#4CAF50" />,
};

// Function to check if an icon exists in base icons
export const hasBaseIcon = (iconType: string): boolean => {
    return iconType in BASE_ICONS;
};
