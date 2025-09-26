import { MDXProvider } from '@mdx-js/react';
import { Container } from '@mantine/core';

import TermsOfService from './mdx/ko/terms.mdx';
import classes from './mdx/mdx.module.css';

const TermsPage = () => {
    return (
        <MDXProvider>
            <Container className={classes.markdown} py="xl" size="md">
                <TermsOfService />
            </Container>
        </MDXProvider>
    );
};

export default TermsPage;
