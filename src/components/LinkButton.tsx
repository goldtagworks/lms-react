import { Button, ButtonProps } from '@mantine/core';
import React, { memo } from 'react';

interface LinkButtonProps extends ButtonProps {
    label: string;
    href?: string;
    onClick?: () => void;
}

const LinkButtonComponent = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, LinkButtonProps>(({ label, href, onClick, ...props }, ref) => {
    return (
        <Button ref={ref as any} component={href ? 'a' : 'button'} href={href} variant="subtle" {...props} onClick={onClick}>
            {label}
        </Button>
    );
});

LinkButtonComponent.displayName = 'LinkButton';

export const LinkButton = memo(LinkButtonComponent);
