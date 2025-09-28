import { MDXProvider } from '@mdx-js/react';
import PageContainer from '@main/components/layout/PageContainer';

import TermsOfService from './mdx/ko/terms.mdx';
import classes from './mdx/mdx.module.css';

const TermsPage = () => {
    return (
        <MDXProvider>
            <PageContainer roleMain className={classes.markdown} py={48} size="md">
                <TermsOfService />
            </PageContainer>
        </MDXProvider>
    );
};

export default TermsPage;
