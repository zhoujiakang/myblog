import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { reveal } from './directives/reveal'

// 自托管字体（通过 @fontsource 打包进站点，不依赖 Google Fonts CDN，国内访问更稳定）
import '@fontsource/inter/400.css'
import '@fontsource/inter/900.css'
import '@fontsource/barlow/700.css'
import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/700.css'

import './styles/global.css'

createApp(App).use(router).directive('reveal', reveal).mount('#app')
