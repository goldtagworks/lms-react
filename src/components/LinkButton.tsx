import { Button, ButtonProps } from '@mantine/core';
import { memo } from 'react';

interface LinkButtonProps extends ButtonProps {
    label: string;
    href?: string;
}

const LinkButtonComponent = ({ label, href, ...props }: LinkButtonProps) => {
    return (
        <Button component={href ? 'a' : 'button'} href={href} variant="subtle" {...props}>
            {label}
        </Button>
    );
};

export const LinkButton = memo(LinkButtonComponent);
