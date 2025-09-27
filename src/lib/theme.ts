// Mantine Theme 확장 & 디자인 토큰 매핑 (docs/050_design_tokens.json 기준 간략 버전)
// TODO: 실제 tokens JSON 파싱 로직 및 타입 강화
import { createTheme, MantineThemeOverride } from '@mantine/core';

export const theme: MantineThemeOverride = createTheme({
    colors: {
        primary: ['#f2f6ff', '#d9e6ff', '#b0ceff', '#86b5ff', '#5d9dff', '#3385ff', '#0a6dff', '#0057d6', '#0042a3', '#002c70'],
        accent: ['#fff5f2', '#ffe1d6', '#ffc2ad', '#ffa184', '#ff815b', '#ff6132', '#fa4106', '#d12f00', '#a11f00', '#701300']
    },
    primaryColor: 'primary',
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen',
    defaultRadius: 'md',
    // radius 확장: md(기본), lg(16px), xl(24px)
    radius: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px'
    },
    // 그림자 토큰: card, md(기본), hero(히어로 이미지)
    shadows: {
        xs: '0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 2px 4px rgba(0,0,0,0.06)',
        md: '0 4px 12px rgba(0,0,0,0.08)',
        lg: '0 6px 20px rgba(0,0,0,0.10)',
        hero: '0 8px 32px rgba(80,120,200,0.08)'
    },
    // spacing 디자인 토큰 매핑 (docs/000. AI 학습데이터/050_design_tokens.json)
    spacing: {
        none: '0px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '40px',
        hero: '64px',
        chipX: '8px',
        chipY: '2px'
    } as Record<string, string>,
    // custom 기타 토큰 (letterSpacing 등) -> CSS 변수 사용 권장
    other: {
        letterSpacing: {
            tight: '0.2px',
            normal: '0',
            wide: '0.5px'
        },
        gradients: {
            hero: 'linear-gradient(90deg, #f5f7fa 60%, #e0e7ff 100%)',
            promo: 'linear-gradient(90deg, #e0e7ff 60%, #f5f7fa 100%)'
        },
        spacingExtra: {
            listIndent: 18 // NOTE: 디자인 상 16/24 전환 가능성 → 확정 전 유지
        }
    }
});

export default theme;
