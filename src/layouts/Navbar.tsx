import { Box } from '@mantine/core';

import { LinkButton } from '../components/LinkButton';

const Navbar = () => (
    <Box aria-label="모바일 메뉴" component="nav" display="flex" style={{ flexDirection: 'column', gap: 8 }}>
        <LinkButton color="primary" href="#courses" justify="flex-start" label="코스" variant="subtle" />
        <LinkButton color="primary" href="#guide" justify="flex-start" label="가이드" variant="subtle" />
        <LinkButton color="primary" href="#support" justify="flex-start" label="고객센터" variant="subtle" />
        <LinkButton color="primary" href="#login" justify="flex-start" label="로그인" variant="light" />
    </Box>
);

export default Navbar;
