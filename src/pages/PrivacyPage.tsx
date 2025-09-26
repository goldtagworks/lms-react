import { MDXProvider } from '@mdx-js/react';
import { Container } from '@mantine/core';

import PrivacyPolicy from './mdx/ko/privacy-policy.mdx';
import classes from './mdx/mdx.module.css';

const PrivacyPage = () => {
    return (
        <MDXProvider>
            <Container className={classes.markdown} py="xl" size="md">
                <PrivacyPolicy />
            </Container>
        </MDXProvider>
    );
};

export default PrivacyPage;
