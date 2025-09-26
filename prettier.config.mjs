export default {
    tabWidth: 4,
    singleQuote: true,
    endOfLine: 'auto',
    trailingComma: 'none',
    printWidth: 200,
    overrides: [
        {
            files: ['*.tsx', '*.jsx', '*.js', '*.ts', '*.vue', '*.scss', '*.css', '*.html', '*.md', '*.json']
        },
        {
            files: ['*.yaml'],
            options: {
                tabWidth: 2
            }
        }
    ]
};
