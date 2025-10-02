import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Container, Stack, Text, Title } from '@mantine/core';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorId: Date.now().toString(36)
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorId: Date.now().toString(36)
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // 운영용 로깅 (추후 확장)
        // 에러 로깅
        /*
        console.error('[ErrorBoundary]', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorId: this.state.errorId,
            timestamp: new Date().toISOString()
        });
        */
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Container py="xl" size="sm">
                    <Stack align="center" gap="lg">
                        <AlertTriangle color="red" size={48} />
                        <Title order={2} ta="center">
                            일시적인 오류가 발생했습니다
                        </Title>
                        <Alert color="red" style={{ width: '100%' }} variant="light">
                            <Text size="sm">페이지 로딩 중 예상치 못한 문제가 발생했습니다. 새로고침 후에도 계속 문제가 발생하면 고객센터로 문의해주세요.</Text>
                        </Alert>
                        <Button leftSection={<RefreshCw size={16} />} size="lg" onClick={this.handleReload}>
                            페이지 새로고침
                        </Button>
                        <Text c="dimmed" size="xs">
                            오류 ID: {this.state.errorId}
                        </Text>
                    </Stack>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
