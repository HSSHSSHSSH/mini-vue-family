import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import store from './store'
import pinia from './pinia'
import h_store from './hStore'
import h_pinia  from './hPinia'



const app = createApp(App)
app.use(store)
app.use(h_store as any)
app.use(pinia)
app.use(h_pinia as any)

app.mount('#app')
