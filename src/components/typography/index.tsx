import { Text, TextProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

// 공통: semantic typography 3계층
// Title: 주요 헤딩/카드 타이틀. size=md 고정 (추후 theme scale 조정 가능)
// Body: 일반 본문/설명/사용자 작성 컨텐츠. size=sm
// Meta: 식별/부가/짧은 정량 정보. size=xs + dimmed 기본
// 규칙: 클릭/포커스 가능한 interactive 텍스트는 최소 Body 이상 사용 (Meta 지양)

export interface SemanticTextProps extends Omit<TextProps, 'size'> {
    sizeOverride?: TextProps['size']; // 필요시 강제 override (되도록 사용 자제)
    children?: ReactNode;
    title?: string; // HTML title (툴팁) 허용
}

export const TextTitle = forwardRef<any, SemanticTextProps>(({ sizeOverride, children, ...rest }, ref) => {
    return (
        <Text ref={ref} fw={rest.fw || 700} size={sizeOverride || 'md'} {...rest}>
            {children}
        </Text>
    );
});
TextTitle.displayName = 'TextTitle';

export const TextBody = forwardRef<any, SemanticTextProps>(({ sizeOverride, children, ...rest }, ref) => {
    return (
        <Text ref={ref} size={sizeOverride || 'sm'} {...rest}>
            {children}
        </Text>
    );
});
TextBody.displayName = 'TextBody';

export const TextMeta = forwardRef<any, SemanticTextProps>(({ sizeOverride, c, children, ...rest }, ref) => {
    return (
        <Text ref={ref} c={c || 'dimmed'} size={sizeOverride || 'xs'} {...rest}>
            {children}
        </Text>
    );
});
TextMeta.displayName = 'TextMeta';

export default { TextTitle, TextBody, TextMeta };
