module.exports = {
  staticDirs: ['../public'],
  stories: ['../src/**/*.stories.@(tsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/preset-create-react-app'],
  typescript: {
    check: true
  },
  framework: '@storybook/react',
  core: {
    builder: 'webpack5'
  }
};
