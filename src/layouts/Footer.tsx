import { Container, Group, Text } from '@mantine/core';
import { LinkButton } from '@main/components/LinkButton';
import { useI18n } from '@main/lib/i18n';

const Footer = () => {
    const { t } = useI18n();

    return (
        <Container component="footer" ta="center">
            <Group gap="md" justify="center" py="md">
                <LinkButton bg="none" h="auto" href="/terms" label={t('nav.terms')} p={0} variant="subtle" />
                <LinkButton bg="none" h="auto" href="/privacy" label={t('nav.privacy')} p={0} variant="subtle" />
            </Group>
            <Text c="dimmed" pb={16} size="sm">
                COPYRIGHT © YOUR FOUNDATION · System Inquiries: +82-2-0000-0000
            </Text>
        </Container>
    );
};

export default Footer;
