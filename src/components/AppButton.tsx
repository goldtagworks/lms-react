import { Button, ButtonProps } from '@mantine/core';
import { memo } from 'react';
import { Link } from 'react-router-dom';

import { applyRoleProps, ButtonRole } from '../lib/buttonRoles';

export interface AppButtonProps extends Omit<ButtonProps, 'children'> {
    label: string;
    href?: string;
    roleName?: ButtonRole; // semantic role (role 예약어 피하기 위해 roleName 사용)
    component?: any; // Mantine polymorphic component override
    onClick?: any; // Handler (ButtonProps 타입 접근 제한으로 any 사용)
}

const AppButtonComponent = ({ label, href, roleName, ...props }: AppButtonProps) => {
    let finalProps: ButtonProps = { ...props } as ButtonProps;

    if (roleName) {
        finalProps = applyRoleProps(roleName, finalProps);
    } else {
        // 기본 fallback variant (이전 동작 유지)
        if (!finalProps.variant) finalProps.variant = 'subtle';
    }

    const isInternal = href && href.startsWith('/') && !href.startsWith('//');

    if (href && isInternal) {
        return (
            <Button component={Link} radius="md" to={href} {...finalProps}>
                {label}
            </Button>
        );
    }

    if (href) {
        return (
            <Button component="a" href={href} radius="md" {...finalProps}>
                {label}
            </Button>
        );
    }

    return (
        <Button radius="md" {...finalProps}>
            {label}
        </Button>
    );
};

export const AppButton = memo(AppButtonComponent);
