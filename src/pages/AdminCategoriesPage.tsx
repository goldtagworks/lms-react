import { ActionIcon, Button, Group, Modal, Stack, Table, TextInput, Tooltip, Notification } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { Edit3, Plus, Save, X, RefreshCw } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { useI18n } from '@main/lib/i18n';
import { useAdminCategories } from '@main/hooks/admin/useAdminCategories';
import { useEffect, useState } from 'react';

export default function AdminCategoriesPage() {
    const { t } = useI18n();
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [q, setQ] = useState('');
    const {
        items: paged,
        page: safePage,
        totalPages: pageCount,
        setQ: setQInHook,
        createOpen,
        setCreateOpen,
        newName,
        setNewName,
        handleCreate,
        creating,
        renameId,
        renameValue,
        setRenameValue,
        setRenameId,
        startRename,
        commitRename,
        errorMsg,
        setErrorMsg,
        setPage: setHookPage
    } = useAdminCategories({ pageSize });

    // local q sync
    useEffect(() => {
        setQInHook(q);
    }, [q, setQInHook]);
    useEffect(() => {
        setHookPage(page);
    }, [page, setHookPage]);

    function resetFilters() {
        setQ('');
        setPage(1);
    }
    const creatingErr = errorMsg;

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput aria-label={t('a11y.search')} placeholder={t('admin.categories.search')} radius="md" size="sm" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
                        {/* active filter removed (schema has no active) */}
                        <Tooltip label={t('common.resetFilters')}>
                            <ActionIcon aria-label={t('common.resetFilters')} variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Button leftSection={<Plus size={16} />} size="sm" onClick={() => setCreateOpen(true)}>
                            {t('admin.categories.modal.newTitle')}
                        </Button>
                    </Group>
                }
                description={t('admin.categories.description')}
                title={t('admin.categories.title')}
            />

            <Stack gap="lg" mt="md">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            {/* order column removed */}
                            <Table.Th style={{ width: 260 }} ta="center">
                                {t('admin.categories.table.name')}
                            </Table.Th>
                            <Table.Th style={{ width: 220 }} ta="center">
                                {t('admin.categories.table.slug')}
                            </Table.Th>
                            <Table.Th style={{ width: 140 }} ta="center">
                                {t('admin.categories.table.actions')}
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <TextMeta py={20} ta="center">
                                        {t('admin.categories.table.empty')}
                                    </TextMeta>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {paged.map((c) => (
                            <Table.Tr key={c.id}>
                                <Table.Td>
                                    {renameId === c.id ? (
                                        <Group gap={4} wrap="nowrap">
                                            <TextInput
                                                aria-label={t('a11y.admin.categoryNameInput')}
                                                size="sm"
                                                style={{ flexGrow: 1 }}
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.currentTarget.value)}
                                            />
                                            <ActionIcon aria-label={t('common.save')} color="green" size="sm" variant="light" onClick={commitRename}>
                                                <Save size={14} />
                                            </ActionIcon>
                                            <ActionIcon aria-label={t('common.cancel')} color="red" size="sm" variant="light" onClick={() => setRenameId(null)}>
                                                <X size={14} />
                                            </ActionIcon>
                                        </Group>
                                    ) : (
                                        <Group gap={6} wrap="nowrap">
                                            <TextBody fw={500} sizeOverride="sm">
                                                {c.name}
                                            </TextBody>
                                            <ActionIcon aria-label={t('admin.categories.tooltip.rename')} size="sm" variant="subtle" onClick={() => startRename(c)}>
                                                <Edit3 size={14} />
                                            </ActionIcon>
                                        </Group>
                                    )}
                                </Table.Td>
                                <Table.Td>
                                    <TextMeta>{c.slug}</TextMeta>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group gap={4} justify="center">
                                        <Tooltip label={t('admin.categories.tooltip.rename')}>
                                            <ActionIcon aria-label={t('admin.categories.tooltip.rename')} size="sm" variant="subtle" onClick={() => startRename(c)}>
                                                <Edit3 size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Stack>

            <PaginationBar align="right" page={safePage} totalPages={pageCount} onChange={setPage} />

            <Modal centered opened={createOpen} radius="md" size="sm" title={t('admin.categories.modal.newTitle')} onClose={() => setCreateOpen(false)}>
                <Stack gap="sm">
                    {creatingErr && (
                        <Notification color="red" title={t('errors.error')} onClose={() => setErrorMsg(null)}>
                            {creatingErr}
                        </Notification>
                    )}
                    <TextInput
                        aria-label={t('a11y.admin.categoryNameInput')}
                        label={t('admin.categories.form.nameLabel')}
                        placeholder={t('admin.categories.form.namePlaceholder')}
                        radius="md"
                        value={newName}
                        onChange={(e) => setNewName(e.currentTarget.value)}
                    />
                    <Group justify="flex-end" mt="sm">
                        <Button disabled={creating} leftSection={<Save size={14} />} size="sm" onClick={handleCreate}>
                            {t('common.create')}
                        </Button>
                        <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setCreateOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </PageContainer>
    );
}
