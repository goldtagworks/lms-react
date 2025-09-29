import { ActionIcon, Badge, Button, Divider, Group, Modal, NumberInput, Notification, Select, Stack, Switch, Table, TextInput, Tooltip } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { Plus, Pencil, Ban, RotateCcw, RefreshCw, Save, X } from 'lucide-react';
import useAdminCoupons from '@main/hooks/admin/useAdminCoupons';
import { useI18n } from '@main/lib/i18n';

type ActiveFilter = 'all' | 'active' | 'inactive';

// (PagedCouponsResult) 이전 로컬 구현 잔여 타입 제거 (훅에서 반환)

const AdminCouponsPage = () => {
    const { t } = useI18n();
    const {
        paged,
        q,
        activeFilter,
        setQ,
        setActiveFilter,
        setPage,
        resetFilters,
        // creation
        createOpen,
        setCreateOpen,
        cCode,
        cType,
        cValue,
        cCurrency,
        cMaxUses,
        cPerUser,
        cStart,
        cEnd,
        setCCode,
        setCType,
        setCValue,
        setCCurrency,
        setCMaxUses,
        setCPerUser,
        setCStart,
        setCEnd,
        createErr,
        setCreateErr,
        createNew,
        // edit
        editId,
        editDraft,
        setEditDraft,
        setEditId,
        setEditErr,
        editErr,
        openEdit,
        commitEdit,
        toggleActive,
        softDeactivate
    } = useAdminCoupons({ pageSize: 20 });

    return (
        <PageContainer roleMain py={48} size="lg">
            <PageHeader
                actions={
                    <Group gap="xs">
                        <TextInput
                            aria-label={t('a11y.admin.codeSearch')}
                            placeholder={t('admin.coupons.search')}
                            radius="md"
                            size="sm"
                            value={q}
                            onChange={(e) => {
                                setQ(e.currentTarget.value);
                                setPage(1);
                            }}
                        />
                        <Select
                            aria-label={t('a11y.admin.filterActive')}
                            data={[
                                { value: 'all', label: t('admin.coupons.filter.all') },
                                { value: 'active', label: t('admin.coupons.filter.active') },
                                { value: 'inactive', label: t('admin.coupons.filter.inactive') }
                            ]}
                            radius="md"
                            size="sm"
                            value={activeFilter}
                            onChange={(v) => {
                                setActiveFilter((v as ActiveFilter) || 'all');
                                setPage(1);
                            }}
                        />
                        <Tooltip label={t('common.resetFilters')}>
                            <ActionIcon aria-label={t('common.resetFilters')} variant="light" onClick={resetFilters}>
                                <RefreshCw size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Button leftSection={<Plus size={16} />} size="sm" onClick={() => setCreateOpen(true)}>
                            {t('admin.coupons.modal.newTitle')}
                        </Button>
                    </Group>
                }
                description={t('admin.coupons.description')}
                title={t('admin.coupons.title')}
            />

            <Stack gap="lg" mt="md">
                <Table highlightOnHover striped withColumnBorders withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 140 }}>{t('admin.coupons.table.code')}</Table.Th>
                            <Table.Th style={{ width: 110 }}>{t('admin.coupons.table.type')}</Table.Th>
                            <Table.Th style={{ width: 120 }}>{t('admin.coupons.table.value')}</Table.Th>
                            <Table.Th style={{ width: 160 }}>{t('admin.coupons.table.period')}</Table.Th>
                            <Table.Th style={{ width: 120 }}>{t('admin.coupons.table.usage')}</Table.Th>
                            <Table.Th style={{ width: 90 }}>{t('admin.coupons.table.status')}</Table.Th>
                            <Table.Th style={{ width: 120 }} ta="center">
                                {t('admin.coupons.table.actions')}
                            </Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {paged.items.length === 0 && (
                            <Table.Tr>
                                <Table.Td colSpan={7}>
                                    <TextMeta py={20} ta="center">
                                        {t('admin.coupons.table.empty')}
                                    </TextMeta>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {paged.items.map((c) => {
                            const period = c.starts_at || c.ends_at ? `${c.starts_at ? c.starts_at.slice(0, 10) : '—'} ~ ${c.ends_at ? c.ends_at.slice(0, 10) : '—'}` : '—';

                            return (
                                <Table.Tr key={c.id} style={{ opacity: c.active ? 1 : 0.55 }}>
                                    <Table.Td>
                                        <TextBody fw={600} sizeOverride="sm">
                                            {c.code}
                                        </TextBody>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={c.type === 'percent' ? 'indigo' : 'teal'} size="sm" variant="light">
                                            {c.type}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{c.type === 'percent' ? `${c.value}%` : `${c.value.toLocaleString()} ${c.currency_code || ''}`}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{period}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>
                                            {c.used_count}/{c.max_uses ?? '∞'}
                                        </TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={c.active ? 'green' : 'gray'} size="sm" variant="light">
                                            {t(c.active ? 'status.active' : 'status.inactive')}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Group gap={4} justify="center">
                                            <Tooltip label={t('common.edit')}>
                                                <ActionIcon aria-label={t('common.edit')} size="sm" variant="subtle" onClick={() => openEdit(c)}>
                                                    <Pencil size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={t(c.active ? 'admin.categories.tooltip.deactivate' : 'admin.categories.tooltip.activate')}>
                                                <ActionIcon aria-label={t('a11y.admin.activateToggle')} color={c.active ? 'red' : 'green'} size="sm" variant="subtle" onClick={() => toggleActive(c)}>
                                                    {c.active ? <Ban size={14} /> : <RotateCcw size={14} />}
                                                </ActionIcon>
                                            </Tooltip>
                                            {c.active && (
                                                <Tooltip label={t('admin.categories.tooltip.instantDeactivate')}>
                                                    <ActionIcon aria-label={t('a11y.admin.instantDeactivate')} color="orange" size="sm" variant="subtle" onClick={() => softDeactivate(c)}>
                                                        <Ban size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
                <PaginationBar page={paged.page} totalPages={paged.totalPages} onChange={(p) => setPage(p)} />
            </Stack>

            {/* 생성 모달 */}
            <Modal centered opened={createOpen} radius="md" size="lg" title={t('admin.coupons.modal.newTitle')} onClose={() => setCreateOpen(false)}>
                <Stack gap="sm">
                    {createErr && (
                        <Notification color="red" title={t('errors.error')} onClose={() => setCreateErr(null)}>
                            {createErr}
                        </Notification>
                    )}
                    <Group grow>
                        <TextInput label={t('admin.coupons.form.code')} placeholder="WELCOME10" value={cCode} onChange={(e) => setCCode(e.currentTarget.value)} />
                        <Select
                            data={[
                                { value: 'percent', label: 'percent' },
                                { value: 'fixed', label: 'fixed' }
                            ]}
                            label={t('admin.coupons.form.type')}
                            value={cType}
                            onChange={(v) => v && setCType(v as 'percent' | 'fixed')}
                        />
                        <NumberInput label={t('admin.coupons.form.value')} min={1} value={cValue} onChange={(val) => setCValue(typeof val === 'number' ? val : '')} />
                    </Group>
                    {cType === 'fixed' && (
                        <TextInput label={t('admin.coupons.form.currency')} placeholder="KRW" value={cCurrency} onChange={(e) => setCCurrency(e.currentTarget.value.toUpperCase())} />
                    )}
                    <Group grow>
                        <NumberInput
                            label={t('admin.coupons.form.maxUses')}
                            min={1}
                            placeholder={t('admin.coupons.form.unlimited')}
                            value={cMaxUses}
                            onChange={(v) => setCMaxUses(typeof v === 'number' ? v : '')}
                        />
                        <NumberInput
                            label={t('admin.coupons.form.perUser')}
                            min={1}
                            placeholder={t('admin.coupons.form.unlimited')}
                            value={cPerUser}
                            onChange={(v) => setCPerUser(typeof v === 'number' ? v : '')}
                        />
                    </Group>
                    <Group grow>
                        <TextInput label={t('admin.coupons.form.start')} placeholder="2025-09-01" value={cStart} onChange={(e) => setCStart(e.currentTarget.value)} />
                        <TextInput label={t('admin.coupons.form.end')} placeholder="2025-09-30" value={cEnd} onChange={(e) => setCEnd(e.currentTarget.value)} />
                    </Group>
                    <Divider my="xs" />
                    <Group justify="flex-end" mt="sm">
                        <Button leftSection={<Save size={14} />} size="sm" onClick={createNew}>
                            {t('common.create')}
                        </Button>
                        <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setCreateOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* 수정 모달 */}
            <Modal centered opened={!!editId} radius="md" size="lg" title={t('admin.coupons.modal.editTitle')} onClose={() => setEditId(null)}>
                {editId && (
                    <Stack gap="sm">
                        {editErr && (
                            <Notification color="red" title={t('errors.error')} onClose={() => setEditErr(null)}>
                                {editErr}
                            </Notification>
                        )}
                        <Group grow>
                            <TextInput label={t('admin.coupons.form.code')} radius="md" value={editDraft.code} onChange={(e) => setEditDraft((d) => ({ ...d, code: e.currentTarget.value }))} />
                            <Select
                                data={[
                                    { value: 'percent', label: 'percent' },
                                    { value: 'fixed', label: 'fixed' }
                                ]}
                                label={t('admin.coupons.form.type')}
                                radius="md"
                                value={editDraft.type}
                                onChange={(v) => v && setEditDraft((d) => ({ ...d, type: v as 'percent' | 'fixed' }))}
                            />
                            <NumberInput
                                label={t('admin.coupons.form.value')}
                                min={1}
                                radius="md"
                                value={editDraft.value as number | undefined}
                                onChange={(val) => setEditDraft((d) => ({ ...d, value: typeof val === 'number' ? val : d.value }))}
                            />
                        </Group>
                        {editDraft.type === 'fixed' && (
                            <TextInput
                                label={t('admin.coupons.form.currency')}
                                radius="md"
                                value={editDraft.currency_code || ''}
                                onChange={(e) => setEditDraft((d) => ({ ...d, currency_code: e.currentTarget.value.toUpperCase() }))}
                            />
                        )}
                        <Group grow>
                            <NumberInput
                                label={t('admin.coupons.form.maxUses')}
                                min={1}
                                placeholder={t('admin.coupons.form.unlimited')}
                                radius="md"
                                value={editDraft.max_uses as number | undefined}
                                onChange={(val) => setEditDraft((d) => ({ ...d, max_uses: typeof val === 'number' ? val : undefined }))}
                            />
                            <NumberInput
                                label={t('admin.coupons.form.perUser')}
                                min={1}
                                placeholder={t('admin.coupons.form.unlimited')}
                                radius="md"
                                value={editDraft.per_user_limit as number | undefined}
                                onChange={(val) => setEditDraft((d) => ({ ...d, per_user_limit: typeof val === 'number' ? val : undefined }))}
                            />
                        </Group>
                        <Group grow>
                            <TextInput
                                label={t('admin.coupons.form.start')}
                                radius="md"
                                value={editDraft.starts_at || ''}
                                onChange={(e) => setEditDraft((d) => ({ ...d, starts_at: e.currentTarget.value || undefined }))}
                            />
                            <TextInput
                                label={t('admin.coupons.form.end')}
                                radius="md"
                                value={editDraft.ends_at || ''}
                                onChange={(e) => setEditDraft((d) => ({ ...d, ends_at: e.currentTarget.value || undefined }))}
                            />
                        </Group>
                        <Switch checked={!!editDraft.active} label={t('admin.coupons.form.activeState')} onChange={(e) => setEditDraft((d) => ({ ...d, active: e.currentTarget.checked }))} />
                        <Group justify="flex-end" mt="sm">
                            <Button leftSection={<Save size={14} />} size="sm" onClick={commitEdit}>
                                {t('common.save')}
                            </Button>
                            <Button leftSection={<X size={14} />} size="sm" variant="default" onClick={() => setEditId(null)}>
                                {t('common.cancel')}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </PageContainer>
    );
};

export default AdminCouponsPage;
