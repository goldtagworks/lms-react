import type { CouponRow } from '@main/hooks/admin/useAdminCoupons';

import { ActionIcon, Badge, Button, Divider, Group, Modal, NumberInput, Notification, Select, Stack, Switch, Table, TextInput, Tooltip } from '@mantine/core';
import { TextBody, TextMeta } from '@main/components/typography';
import PageContainer from '@main/components/layout/PageContainer';
import PageHeader from '@main/components/layout/PageHeader';
import PaginationBar from '@main/components/PaginationBar';
import { Plus, Pencil, Ban, RotateCcw, RefreshCw, Save, X } from 'lucide-react';
import { useI18n } from '@main/lib/i18n';
import { useAdminCoupons } from '@main/hooks/admin/useAdminCoupons';

type ActiveFilter = 'all' | 'active' | 'inactive';

// (PagedCouponsResult) 이전 로컬 구현 잔여 타입 제거 (훅에서 반환)

const AdminCouponsPage = () => {
    const { t } = useI18n();
    const {
        data,
        page,
        setPage,
        q,
        setQ,
        activeFilter,
        setActiveFilter,
        createOpen,
        setCreateOpen,
        cCode,
        setCCode,
        cType,
        setCType,
        cValue,
        setCValue,
        cCurrency,
        setCCurrency,
        cMaxUses,
        setCMaxUses,
        cPerUser,
        setCPerUser,
        cStart,
        setCStart,
        cEnd,
        setCEnd,
        createNew,
        createErr,
        editId,
        editDraft,
        setEditDraft,
        openEdit,
        commitEdit,
        toggleActive,
        softDeactivate,
        resetFilters,
        editErr,
        setEditErr,
        setCreateErr,
        isLoading,
        setEditId
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
                        {data.items.length === 0 && !isLoading && (
                            <Table.Tr>
                                <Table.Td colSpan={7}>
                                    <TextMeta py={20} ta="center">
                                        {t('admin.coupons.table.empty')}
                                    </TextMeta>
                                </Table.Td>
                            </Table.Tr>
                        )}
                        {data.items.map((c: CouponRow) => {
                            const period = c.starts_at || c.ends_at ? `${c.starts_at ? c.starts_at.slice(0, 10) : '—'} ~ ${c.ends_at ? c.ends_at.slice(0, 10) : '—'}` : '—';
                            const valueText = c.discount_type === 'percent' ? `${c.percent ?? 0}%` : `${(c.amount_cents ?? 0).toLocaleString()} KRW`;

                            return (
                                <Table.Tr key={c.id} style={{ opacity: c.is_active ? 1 : 0.55 }}>
                                    <Table.Td>
                                        <TextBody fw={600} sizeOverride="sm">
                                            {c.code}
                                        </TextBody>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={c.discount_type === 'percent' ? 'indigo' : 'teal'} size="sm" variant="light">
                                            {c.discount_type}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{valueText}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>{period}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <TextMeta>0/{c.max_redemptions ?? '∞'}</TextMeta>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge color={c.is_active ? 'green' : 'gray'} size="sm" variant="light">
                                            {t(c.is_active ? 'status.active' : 'status.inactive')}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="center">
                                        <Group gap={4} justify="center">
                                            <Tooltip label={t('common.edit')}>
                                                <ActionIcon aria-label={t('common.edit')} size="sm" variant="subtle" onClick={() => openEdit(c)}>
                                                    <Pencil size={14} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label={t(c.is_active ? 'admin.categories.tooltip.deactivate' : 'admin.categories.tooltip.activate')}>
                                                <ActionIcon
                                                    aria-label={t('a11y.admin.activateToggle')}
                                                    color={c.is_active ? 'red' : 'green'}
                                                    size="sm"
                                                    variant="subtle"
                                                    onClick={() => toggleActive(c)}
                                                >
                                                    {c.is_active ? <Ban size={14} /> : <RotateCcw size={14} />}
                                                </ActionIcon>
                                            </Tooltip>
                                            {c.is_active && (
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
                <PaginationBar page={page} totalPages={data.pageCount} onChange={setPage} />
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
                                value={editDraft.discount_type as any}
                                onChange={(v) => v && setEditDraft((d) => ({ ...d, discount_type: v as 'percent' | 'fixed' }))}
                            />
                            <NumberInput
                                label={t('admin.coupons.form.value')}
                                min={1}
                                radius="md"
                                value={(editDraft.discount_type === 'percent' ? editDraft.percent : editDraft.amount_cents) as number | undefined}
                                onChange={(val) =>
                                    setEditDraft((d: any) => ({
                                        ...d,
                                        ...(d.discount_type === 'percent' ? { percent: typeof val === 'number' ? val : d.percent } : { amount_cents: typeof val === 'number' ? val : d.amount_cents })
                                    }))
                                }
                            />
                        </Group>
                        {editDraft.discount_type === 'fixed' && (
                            <TextInput label={t('admin.coupons.form.currency')} radius="md" value={cCurrency} onChange={(e) => setCCurrency(e.currentTarget.value.toUpperCase())} />
                        )}
                        <Group grow>
                            <NumberInput
                                label={t('admin.coupons.form.maxUses')}
                                min={1}
                                placeholder={t('admin.coupons.form.unlimited')}
                                radius="md"
                                value={editDraft.max_redemptions as number | undefined}
                                onChange={(val) => setEditDraft((d) => ({ ...d, max_redemptions: typeof val === 'number' ? val : undefined }))}
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
                        <Switch checked={!!editDraft.is_active} label={t('admin.coupons.form.activeState')} onChange={(e) => setEditDraft((d) => ({ ...d, is_active: e.currentTarget.checked }))} />
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
