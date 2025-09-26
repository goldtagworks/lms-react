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
    defaultRadius: 'md'
});

export default theme;
