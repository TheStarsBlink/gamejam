import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 导入全局样式（如果需要）
// import './style.css' 

const app = createApp(App)

app.use(createPinia()) // 使用Pinia
app.mount('#app') // 挂载到index.html中的#app元素 