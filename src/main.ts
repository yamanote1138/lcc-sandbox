import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'

import './main.css'

const app = createApp(App)

app.use(ui)

app.config.errorHandler = (err, instance, info) => {
  console.error('=== VUE ERROR ===')
  console.error('Error:', err)
  console.error('Info:', info)
  console.error('=================')
}

app.config.warnHandler = (msg, _instance, trace) => {
  console.warn('=== VUE WARNING ===')
  console.warn('Message:', msg)
  console.warn('Trace:', trace)
  console.warn('===================')
}

app.mount('#app')
