import { MDXProvider } from '@mdx-js/react';
import PageContainer from '@main/components/layout/PageContainer';

import PrivacyPolicy from './mdx/ko/privacy-policy.mdx';
import classes from './mdx/mdx.module.css';

const PrivacyPage = () => {
    return (
        <MDXProvider>
            <PageContainer roleMain className={classes.markdown} py={48} size="md">
                <PrivacyPolicy />
            </PageContainer>
        </MDXProvider>
    );
};

export default PrivacyPage;
