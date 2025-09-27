import { Container, ContainerProps } from '@mantine/core';
import React from 'react';

export interface PageContainerProps extends ContainerProps {
    roleMain?: boolean;
    children?: React.ReactNode;
}

export function PageContainer({ children, roleMain, size = 'lg', py = 48, ...rest }: PageContainerProps) {
    // py 48 == 약 3rem (홈 리듬: 32/40/64 중간값) TODO: spacing token으로 승격
    const Comp: any = roleMain ? 'main' : 'div';

    return (
        <Container component={Comp} py={py} size={size} {...rest}>
            {children}
        </Container>
    );
}

export default PageContainer;
