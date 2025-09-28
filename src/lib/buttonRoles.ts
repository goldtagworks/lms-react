// Semantic button role → Mantine variant/color 매핑
// 단순 색상/variant 산재 사용을 방지하기 위한 중앙 정의
// 참고: docs/050_design_tokens.json (현재 버튼 토큰 부재 → 임시 TS 레이어)

import { ButtonProps } from '@mantine/core';

// 단순화: 사용자 피드백에 따라 핵심 4가지 역할만 유지
export type ButtonRole = 'primary' | 'add' | 'edit' | 'delete';

interface RoleStyle {
    variant: ButtonProps['variant'];
    color?: string;
}

export const ROLE_STYLES: Record<ButtonRole, RoleStyle> = {
    primary: { variant: 'filled', color: 'blue' }, // 가장 중요한 CTA
    add: { variant: 'outline', color: 'green' }, // 생성/추가
    edit: { variant: 'light', color: 'blue' }, // 편집/설정
    delete: { variant: 'filled', color: 'red' } // 파괴적
};

// Runtime 도움: direct variant/color override 감지 (role 사용 시)
export function applyRoleProps(role: ButtonRole, props: Omit<ButtonProps, 'variant' | 'color'> & Partial<ButtonProps>) {
    const base = ROLE_STYLES[role];
    const { variant, color, ...rest } = props as ButtonProps & { variant?: ButtonProps['variant']; color?: string };

    if (process.env.NODE_ENV !== 'production') {
        if (variant && variant !== base.variant) {
            // eslint-disable-next-line no-console
            console.warn(`[AppButton] variant override detected for role='${role}'. Provided='${variant}' base='${base.variant}'. Avoid custom variant.`);
        }
        if (color && color !== base.color) {
            // eslint-disable-next-line no-console
            console.warn(`[AppButton] color override detected for role='${role}'. Provided='${color}' base='${base.color}'. Avoid custom color.`);
        }
    }

    return { ...rest, variant: base.variant, color: base.color } as ButtonProps;
}
