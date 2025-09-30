// src/faq/loader.ts
import { z } from 'zod';

const FaqFM = z.object({
    order: z.number().int().nonnegative().default(999),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional(),
    tags: z.array(z.string()).optional(),
    updatedAt: z.string().optional()
});

type FaqFrontmatter = z.infer<typeof FaqFM>;

type MDXModule = {
    default: React.ComponentType<any>;
    frontmatter?: FaqFrontmatter;
};

const modules = {
    ko: import.meta.glob('../faq/ko/*.mdx'),
    en: import.meta.glob('../faq/en/*.mdx')
};

export type FaqEntry = {
    slug: string;
    order: number;
    tags?: string[];
    updatedAt?: string;
    Component: React.ComponentType<any>;
};

export async function loadFaqEntries(locale: string, fallbackLocale = 'ko') {
    const primary = modules[locale] ?? {};
    const fallback = locale === fallbackLocale ? {} : (modules[fallbackLocale] ?? {});

    const map = new Map<string, any>();

    async function ingest(mods: Record<string, () => Promise<unknown>>) {
        for (const [path, loader] of Object.entries(mods)) {
            const mod = (await loader()) as MDXModule;
            const fm = FaqFM.parse(mod.frontmatter ?? {});
            const fileName = path
                .split('/')
                .pop()!
                .replace(/\.mdx?$/, '');
            const slug = fm.slug ?? fileName;

            if (!map.has(slug)) {
                map.set(slug, {
                    slug: slug,
                    order: fm.order,
                    tags: fm.tags,
                    updatedAt: fm.updatedAt,
                    Component: mod.default
                });
            }
        }
    }

    await ingest(primary);
    await ingest(fallback);

    return [...map.values()].sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}
