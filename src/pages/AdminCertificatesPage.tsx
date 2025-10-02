import { ActionIcon, Badge, Button, Group, Modal, Notification, Stack, Table, TextInput, Tooltip } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { RefreshCw, RotateCcw, Search, Save, X } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { useAdminCertificates } from '@main/hooks/admin/useAdminCertificates';
import { useI18n } from '@main/lib/i18n';
import { formatDate } from '@main/lib/format';

export default function AdminCertificatesPage() {
    const {
        paged,
        page: pageSafe,
        totalPages,
        q,
        setQ,
        resetFilters,
        reissueTarget,
        reissueNote,
        reissueErr,
        setReissueNote,
        setReissueErr,
        openReissue,
        commitReissue,
        deactivated,
        toggleDeactivate,
        setPage
    } = useAdminCertificates({ pageSize: 20 });
    const { t } = useI18n();

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput
                            aria-label={t('a11y.search')}
                            leftSection={<Search size={14} />}
                            placeholder={t('a11y.searchCertificatePlaceholder')}
                            radius="md"
                            size="sm"
                            value={q}
                            onChange={(e) => {
                                setQ(e.currentTarget.value);
                                setPage(1);
                            }}
                        />
                        <Tooltip label={t('common.resetFilters')}>
                            <ActionIcon aria-label={t('common.resetFilters')} variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                }
                description={t('empty.certificatesAdminIntro')}
                title={t('nav.adminCertificates')}
            />

            <Stack gap="lg" mt="md">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 220 }} ta="center">
                                {t('certificate.serial')}
                            </Table.Th>
                            <Table.Th style={{ width: 140 }} ta="center">
                                {t('certificate.issuedDateLabel')}
                            </Table.Th>
                            <Table.Th style={{ width: 160 }} ta="center">
                                Enrollment
                            </Table.Th>
                            <Table.Th style={{ width: 170 }} ta="center">
                                ExamAttempt
                            </Table.Th>
                            <Table.Th style={{ width: 90 }} ta="center">
                                {t('certificate.status')}
                            </Table.Th>
                            <Table.Th style={{ width: 140 }} ta="center">
                                {t('common.actions')}
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={6}>
                                    <TextMeta py={20} ta="center">
                                        {t('empty.certificatesNoneAdmin')}
                                    </TextMeta>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {paged.map((c) => {
                            const isDeact = !!deactivated[c.id];

                            return (
                                <Table.Tr key={c.id} style={{ opacity: isDeact ? 0.55 : 1 }}>
                                    <Table.Td>
                                        <TextBody fw={600} sizeOverride="sm">
                                            {c.serial_no}
                                        </TextBody>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{formatDate(c.issued_at)}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{c.enrollment_id.slice(0, 8)}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{c.exam_attempt_id.slice(0, 8)}</TextMeta>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Badge color={isDeact ? 'gray' : 'green'} size="sm" variant="light">
                                            {isDeact ? t('common.status.inactive') : t('common.status.active')}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Group gap={4} justify="center">
                                            <Tooltip label={t('certificate.reissue')}>
                                                <ActionIcon aria-label={t('certificate.reissue')} size="sm" variant="subtle" onClick={() => openReissue(c)}>
                                                    <RotateCcw size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={isDeact ? t('common.activate') : t('common.deactivate')}>
                                                <ActionIcon aria-label={t('certificate.toggleActive')} color={isDeact ? 'green' : 'red'} size="sm" variant="subtle" onClick={() => toggleDeactivate(c)}>
                                                    {isDeact ? <Save size={14} /> : <X size={14} />}
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
                <PaginationBar page={pageSafe} totalPages={totalPages} onChange={(p) => setPage(p)} />
            </Stack>

            <Modal centered opened={!!reissueTarget} radius="md" size="sm" title={t('certificate.reissueTitle')} onClose={() => setReissueErr(null)}>
                {reissueTarget && (
                    <Stack gap="sm">
                        {reissueErr && (
                            <Notification color="red" title={t('errors.error')} onClose={() => setReissueErr(null)}>
                                {reissueErr}
                            </Notification>
                        )}
                        <TextMeta>
                            {t('certificate.existingSerial')}: {reissueTarget.serial_no}
                        </TextMeta>
                        <TextInput
                            aria-label={t('certificate.memoAria')}
                            label={t('certificate.memoLabel')}
                            placeholder={t('certificate.memoPlaceholder')}
                            value={reissueNote}
                            onChange={(e) => setReissueNote(e.currentTarget.value)}
                        />
                        <Group justify="flex-end" mt="sm">
                            <Button leftSection={<RotateCcw size={14} />} size="sm" onClick={commitReissue}>
                                {t('certificate.reissue')}
                            </Button>
                            <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setReissueErr(null)}>
                                {t('common.cancel')}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </PageContainer>
    );
}
