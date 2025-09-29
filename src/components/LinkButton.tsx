import { Button, ButtonProps } from '@mantine/core';
import React, { memo } from 'react';
import { Link } from 'react-router-dom';

interface LinkButtonProps extends Omit<ButtonProps, 'children'> {
    label: string;
    href?: string; // 내부 경로(/로 시작)면 SPA Link, 그 외는 a
    onClick?: (e: React.MouseEvent) => void;
}

const isInternal = (href?: string) => !!href && href.startsWith('/') && !href.startsWith('//');

const LinkButtonComponent = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, LinkButtonProps>(({ label, href, onClick, ...props }, ref) => {
    // Hash(anchor) 처리 (#section 등)
    if (href?.startsWith('#')) {
        return (
            <Button
                ref={ref as any}
                variant="subtle"
                {...props}
                onClick={(e) => {
                    onClick?.(e);
                    e.preventDefault();
                    const el = document.querySelector(href);

                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
            >
                {label}
            </Button>
        );
    }

    if (isInternal(href)) {
        // react-router Link 사용
        return (
            <Button ref={ref as any} component={Link} to={href!} variant="subtle" {...props} onClick={onClick}>
                {label}
            </Button>
        );
    }

    // 외부 혹은 빈 href → a 또는 button
    if (href) {
        return (
            <Button ref={ref as any} component="a" href={href} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} variant="subtle" {...props} onClick={onClick}>
                {label}
            </Button>
        );
    }

    return (
        <Button ref={ref as any} variant="subtle" {...props} onClick={onClick}>
            {label}
        </Button>
    );
});

LinkButtonComponent.displayName = 'LinkButton';

export const LinkButton = memo(LinkButtonComponent);
