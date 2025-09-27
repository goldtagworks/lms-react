import React from 'react';
import { MantineProvider, Paper, Stack, Anchor, Text, Box, Badge } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuth } from '@main/lib/auth';

import AppRouter from './app/router';

function App() {
    const { user } = useAuth();

    return (
        <MantineProvider>
            <AppRouter />
            <Paper withBorder p="sm" radius="md" shadow="sm" style={{ position: 'fixed', bottom: 16, right: 16, width: 240, zIndex: 400 }}>
                <Stack gap={6}>
                    <GroupHeader />
                    <Anchor component={Link} size="xs" to="/signup">
                        1) 강사(사용자) 가입 → 회원가입
                    </Anchor>
                    <Anchor component={Link} size="xs" to="/instructor/inst-1">
                        2) 강사 프로필 (샘플)
                    </Anchor>
                    <Anchor component={Link} size="xs" to="/instructor/courses/new">
                        3) 커리큘럼/강의 작성
                    </Anchor>
                    <Anchor component={Link} size="xs" to="/course/c1">
                        4) 강의 강조(상세에서 배지)
                    </Anchor>
                    {!user && (
                        <Text c="dimmed" size="10px">
                            로그인 없이도 데모 링크 노출
                        </Text>
                    )}
                </Stack>
            </Paper>
        </MantineProvider>
    );
}

function GroupHeader() {
    return (
        <Box>
            <Text fw={600} mb={4} size="xs">
                데모 빠른 이동
            </Text>
            <Badge color="blue" size="xs" variant="light">
                GUIDE
            </Badge>
        </Box>
    );
}

export default App;
