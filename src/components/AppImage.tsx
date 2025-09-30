import React, { useState } from 'react';
import { useI18n } from '@main/lib/i18n';
import { Box, BoxProps, Skeleton, useMantineTheme } from '@mantine/core';

export interface AppImageProps extends Omit<BoxProps, 'src'> {
    src: string;
    alt: string;
    radius?: number | string; // use theme radius token or raw px
    shadow?: string; // maps to theme.shadows key via style var or raw css
    fit?: React.CSSProperties['objectFit'];
    width?: number | string;
    height?: number | string;
    withBorder?: boolean;
    fallbackColor?: string;
    loadingSkeleton?: boolean;
}

// Unified image wrapper to enforce design tokens & graceful loading/fallback.
export function AppImage({
    src,
    alt,
    radius = 'xl',
    shadow = 'hero',
    fit = 'cover',
    width = '100%',
    height,
    withBorder,
    fallbackColor = 'var(--mantine-color-gray-1)',
    loadingSkeleton = true,
    style,
    ...rest
}: AppImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    const theme = useMantineTheme();
    // Resolve radius: if matches theme radius key use value, else keep as provided
    const resolvedRadius = typeof radius === 'number' ? `${radius}px` : (theme.radius as any)[radius as string] || radius;
    const resolvedShadow = shadow && (theme.shadows as any)[shadow] ? (theme.shadows as any)[shadow] : shadow;

    const { t } = useI18n();

    return (
        <Box pos="relative" style={{ width, height, ...style }} {...rest}>
            {loadingSkeleton && !loaded && !error && <Skeleton h={height} radius={resolvedRadius as any} visible={true} w={width} />}
            {!error && (
                <Box
                    alt={alt}
                    component="img"
                    src={src}
                    style={{
                        display: loaded ? 'block' : 'none',
                        objectFit: fit,
                        width: '100%',
                        height,
                        borderRadius: resolvedRadius,
                        boxShadow: resolvedShadow,
                        border: withBorder ? '1px solid var(--mantine-color-gray-3)' : undefined
                    }}
                    onError={() => setError(true)}
                    onLoad={() => setLoaded(true)}
                />
            )}
            {error && (
                <Box
                    bg={fallbackColor}
                    style={{
                        width: '100%',
                        height,
                        borderRadius: resolvedRadius,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: 'var(--mantine-color-dimmed)'
                    }}
                >
                    {t('image.error')}
                </Box>
            )}
        </Box>
    );
}

export default AppImage;
