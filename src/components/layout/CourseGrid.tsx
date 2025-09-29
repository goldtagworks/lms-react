import { SimpleGrid, SimpleGridProps } from '@mantine/core';
import React from 'react';

// 표준 코스 카드 그리드: 한 곳에서 column / spacing 규칙 관리
// 규칙(V1): base 1, sm 2, md 3 (4열은 디자인 검토 후 확장)
// spacing 은 기본 xl(32px) -> 밀도 필요 시 prop override 허용
// NOTE: 4열 도입 시 prop enableFourCols 또는 colsOverride 로 확장 예정

export interface CourseGridProps extends Omit<SimpleGridProps, 'cols'> {
    dense?: boolean; // spacing 축소 옵션
    colsOverride?: SimpleGridProps['cols']; // 특수 케이스 강제 지정
    listMode?: boolean; // 시맨틱 목록 (ul/li) 역할 적용
}

export function CourseGrid({ children, dense, colsOverride, spacing, listMode, ...rest }: CourseGridProps) {
    const cols = colsOverride || { base: 1, sm: 2, md: 3 };
    const finalSpacing = spacing || (dense ? 'lg' : 'xl');

    if (listMode) {
        const items = React.Children.toArray(children).map((c, i) => (
            <li key={i} style={{ listStyle: 'none' }}>
                {c}
            </li>
        ));

        return (
            <SimpleGrid cols={cols} component="ul" spacing={finalSpacing} style={{ margin: 0, padding: 0 }} {...rest}>
                {items}
            </SimpleGrid>
        );
    }

    return (
        <SimpleGrid cols={cols} spacing={finalSpacing} {...rest}>
            {children}
        </SimpleGrid>
    );
}

export default CourseGrid;
