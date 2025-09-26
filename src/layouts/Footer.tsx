import { Container, Group, Text } from '@mantine/core';
import { LinkButton } from '@main/components/LinkButton';

const Footer = () => (
    <Container component="footer" ta="center">
        <Group gap="md" justify="center" py="md">
            <LinkButton bg="none" h="auto" href="/terms" label="이용약관" p={0} variant="subtle" />
            <LinkButton bg="none" h="auto" href="/privacy" label="개인정보처리방침" p={0} variant="subtle" />
            <LinkButton bg="none" h="auto" href="#reject" label="이메일무단수집거부" p={0} variant="subtle" />
        </Group>
        <Text c="dimmed" pb={16} size="sm">
            COPYRIGHT © YOUR FOUNDATION · System Inquiries: +82-2-0000-0000
        </Text>
    </Container>
);

export default Footer;
