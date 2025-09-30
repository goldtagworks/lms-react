import { ActionIcon, Badge, Button, Group, Modal, Stack, Table, TextInput, Tooltip, Switch, Notification } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import { ArrowDown, ArrowUp, Edit3, Plus, Save, X, RefreshCw } from 'lucide-react';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { useI18n } from '@main/lib/i18n';
import useAdminCategoriesPaged from '@main/hooks/admin/useAdminCategoriesPaged';
import { listCategories, createCategory, updateCategory, deactivateCategory, moveCategory } from '@main/lib/repository';
import { useEffect, useState } from 'react';

export default function AdminCategoriesPage() {
    const { t } = useI18n();
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [q, setQ] = useState('');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [creatingErr, setCreatingErr] = useState<string | null>(null);
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const { data, refresh } = useAdminCategoriesPaged(page, { pageSize, q, active: filterActive, sort: 'order' });

    // 간단 refresh (실 서버 전환 시 useQuery 대체)
    useEffect(() => {
        // 초기 시드 (훅이 내부에서 listCategories 호출하지만 외부 side-effect 로직 유지)
        listCategories();
    }, []);

    const paged = data.items;
    const pageCount = data.pageCount;
    const safePage = data.page;

    function resetFilters() {
        setQ('');
        setFilterActive('all');
        setPage(1);
    }
    function handleCreate() {
        setCreatingErr(null);
        if (!newName.trim()) {
            setCreatingErr('이름 필수');

            return false;
        }
        createCategory(newName.trim());
        setNewName('');
        setCreateOpen(false);
        setPage(1);
        refresh();

        return true;
    }
    function startRename(c: any) {
        setRenameId(c.id);
        setRenameValue(c.name);
    }
    function commitRename() {
        if (!renameId) return false;
        if (!renameValue.trim()) return false;
        updateCategory(renameId, { name: renameValue.trim() });
        setRenameId(null);
        refresh();

        return true;
    }
    function toggleActive(c: any) {
        updateCategory(c.id, { active: !c.active });
        refresh();
    }
    function deactivate(c: any) {
        deactivateCategory(c.id);
        refresh();
    }
    function move(c: any, dir: 'up' | 'down') {
        moveCategory(c.id, dir);
        refresh();
    }

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput aria-label={t('a11y.search')} placeholder={t('admin.categories.search')} radius="md" size="sm" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
                        <TextInput
                            readOnly
                            aria-label={t('a11y.admin.filterActive')}
                            placeholder={
                                filterActive === 'all' ? t('admin.categories.filter.all') : filterActive === 'active' ? t('admin.categories.filter.active') : t('admin.categories.filter.inactive')
                            }
                            radius="md"
                            size="sm"
                            style={{ cursor: 'pointer', width: 110 }}
                            value={filterActive === 'all' ? '' : filterActive === 'active' ? t('admin.categories.filter.current.active') : t('admin.categories.filter.current.inactive')}
                            onClick={() => setFilterActive((prev) => (prev === 'all' ? 'active' : prev === 'active' ? 'inactive' : 'all'))}
                        />
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
                            <Table.Th style={{ width: 60 }} ta="center">
                                {t('admin.categories.table.order')}
                            </Table.Th>
                            <Table.Th style={{ width: 260 }} ta="center">
                                {t('admin.categories.table.name')}
                            </Table.Th>
                            <Table.Th style={{ width: 220 }} ta="center">
                                {t('admin.categories.table.slug')}
                            </Table.Th>
                            <Table.Th style={{ width: 100 }} ta="center">
                                {t('admin.categories.table.status')}
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
                        {paged.map((c, idx) => (
                            <Table.Tr key={c.id} style={{ opacity: c.active ? 1 : 0.55 }}>
                                <Table.Td ta="center">
                                    <Group align="center" gap={4} justify="center" wrap="nowrap">
                                        <ActionIcon aria-label={t('a11y.admin.moveUp')} disabled={idx === 0 && safePage === 1} size="sm" variant="subtle" onClick={() => move(c, 'up')}>
                                            <ArrowUp size={14} />
                                        </ActionIcon>
                                        <ActionIcon
                                            aria-label={t('a11y.admin.moveDown')}
                                            disabled={idx === paged.length - 1 && safePage === pageCount}
                                            size="sm"
                                            variant="subtle"
                                            onClick={() => move(c, 'down')}
                                        >
                                            <ArrowDown size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Table.Td>
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
                                            <TextBody c={c.active ? undefined : 'dimmed'} fw={500} sizeOverride="sm">
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
                                    <Badge color={c.active ? 'green' : 'gray'} size="sm" variant="light">
                                        {t(c.active ? 'common.status.active' : 'common.status.inactive')}
                                    </Badge>
                                </Table.Td>
                                <Table.Td ta="center">
                                    <Group gap={4} justify="center">
                                        <Tooltip label={t(c.active ? 'admin.categories.tooltip.deactivate' : 'admin.categories.tooltip.activate')}>
                                            <Switch aria-label={t('a11y.admin.activateToggle')} checked={c.active} size="sm" onChange={() => toggleActive(c)} />
                                        </Tooltip>
                                        {c.active && (
                                            <Tooltip label={t('admin.categories.tooltip.instantDeactivate')}>
                                                <ActionIcon aria-label={t('a11y.admin.instantDeactivate')} color="orange" size="sm" variant="subtle" onClick={() => deactivate(c)}>
                                                    <X size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
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
                        <Notification color="red" title={t('errors.error')} onClose={() => setCreatingErr(null)}>
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
                        <Button leftSection={<Save size={14} />} size="sm" onClick={handleCreate}>
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
