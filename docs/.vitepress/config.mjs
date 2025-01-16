import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "🌐maptalks.three",
  description: "A maptalks layer to render with three.js.",
  base: '/maptalks.three/docs/dist/',
  outDir: './dist/',
  markdown: {
    image: {
      // 默认禁用；设置为 true 可为所有图片启用懒加载。
      lazyLoading: true
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Start', link: '/start/install.md', activeMatch: '/start/' },
      { text: 'API', link: '/api/index.md', activeMatch: '/api/' },
      { text: 'Questions', link: '/questions/index.md', activeMatch: '/questions/' },
      { text: 'Examples', link: 'https://maptalks.org/maptalks.three/demo/index.html' },
    ],

    sidebar: {
      '/start/': [
        { text: 'Install', link: '/start/install.md' },
        { text: 'Hello World', link: '/start/helloworld.md' },
        { text: 'Design Target', link: '/start/target.md' },
        { text: 'Custom BaseObject', link: '/start/custom.md' },
        { text: 'Some Links', link: '/start/links.md' },
      ],
      '/api/': [
        { text: 'Some Types', link: '/api/types.md' },
        { text: 'BaseObject', link: '/api/baseobject.md' },
        { text: 'ThreeLayer', link: '/api/threelayer.md' }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/maptalks/maptalks.three' }
    ],
    lastUpdated: true,
    search: {
      provider: 'local'
    }
  }
})
