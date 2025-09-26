import { Button, ButtonProps } from '@mantine/core';
import { memo } from 'react';

export interface AppButtonProps extends ButtonProps {
    label: string;
    href?: string;
}

const AppButtonComponent = ({ label, href, ...props }: AppButtonProps) => {
    return (
        <Button component={href ? 'a' : 'button'} href={href} radius="md" variant={props.variant || 'subtle'} {...props}>
            {label}
        </Button>
    );
};

export const AppButton = memo(AppButtonComponent);
