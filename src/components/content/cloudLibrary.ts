import { awsIcons, azureIcons, gcpIcons } from '@cloud-diagrams/core';

// Define a type for the library icon structure based on inspection
interface LibraryIcon {
    svg: string;
    metadata: {
        name: string;
        service: string;
        provider: string;
        category?: string;
    };
    variants?: {
        light?: string;
        dark?: string;
        colored?: string;
    };
}

// Helper to convert library icons to our map format
const mapLibraryIcons = (libraryIcons: Record<string, LibraryIcon>, providerPrefix: string) => {
    const map: Record<string, string> = {};
    Object.values(libraryIcons).forEach((icon) => {
        // Normalize key: aws-s3, azure-vm, etc.
        // The metadata.service usually contains the normalized name e.g. "simple-storage-service-s3"
        // We want concise keys if possible, but uniqueness is key.
        // Let's use provider-service from metadata which seems safe.
        // We force lowercase and replace spaces/underscores with dashes just in case.
        const serviceName = icon.metadata.service.toLowerCase().replace(/[\s_]+/g, '-');
        const key = `${providerPrefix}-${serviceName}`;

        // Prefer colored variant, fallback to base svg
        map[key] = icon.variants?.colored || icon.svg;
    });
    return map;
}

export const CLOUD_LIBRARY_ICONS: Record<string, string> = {
    ...mapLibraryIcons(awsIcons as unknown as Record<string, LibraryIcon>, 'aws'),
    ...mapLibraryIcons(azureIcons as unknown as Record<string, LibraryIcon>, 'azure'),
    ...mapLibraryIcons(gcpIcons as unknown as Record<string, LibraryIcon>, 'gcp'),
};
