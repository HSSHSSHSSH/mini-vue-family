<template>
  <div>
    蛙叫你
    <div>
      <!-- <official-pinia></official-pinia> -->
      <!-- <my-pinia></my-pinia> -->
      <my-vuex></my-vuex>
      <official-vuex></official-vuex>
    </div>
  </div>
</template>

<script setup lang="ts">
  import myVuex from './components/customer/myVuex.vue'
  import officialVuex from './components/official/officialVuex.vue';
  // import officialPinia from './components/official/officialPinia.vue';
  // import myPinia from './components/customer/myPinia.vue';
</script>

<style scoped></style>
