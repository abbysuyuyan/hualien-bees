<template>
  <div class="list-controls">
    <!-- Tab 切換 -->
    <div class="status-tabs">
      <button 
        :class="['tab-button', { active: activeTab === 'pending' }]"
        @click="$emit('update:activeTab', 'pending')"
      >
        待配送
      </button>
      <button 
        :class="['tab-button', { active: activeTab === 'completed' }]"
        @click="$emit('update:activeTab', 'completed')"
      >
        已配送
      </button>
      <!-- 動畫底線 -->
      <div 
        class="active-indicator"
        :style="{ 
          transform: `translateX(${activeTab === 'pending' ? '0px' : '96px'})`,
          left: '0px'
        }"
      ></div>
    </div>

    <!-- 篩選器 -->
    <div class="filter-controls">
      <el-select
        :model-value="selectedTag"
        class="tag-filter"
        clearable
        placeholder="篩選類別"
        size="large"
        @update:model-value="$emit('update:selectedTag', $event)"
      >
        <el-option
          v-for="option in tagFilterOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  activeTab: {
    type: String,
    default: 'pending'
  },
  selectedTag: {
    type: String,
    default: ''
  },
  typeOptions: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:activeTab', 'update:selectedTag']);

const tagFilterOptions = computed(() => [
  { value: "", label: "全部類別" },
  ...props.typeOptions,
]);
</script>

<style scoped>
.list-controls {
  max-width: 720px;
  margin: 0 auto 16px;
}

.status-tabs {
  display: flex;
  justify-content: center;
  position: relative;
  gap: 12px;
  width: fit-content;
  margin: 8px auto 24px;
}

.tab-button {
  background: none;
  border: none;
  font-family: 'Noto Sans TC', sans-serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 25px;
  letter-spacing: 0;
  padding: 12px 0 8px 0;
  color: #000000;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  position: relative;
  z-index: 1;
  width: 84px;
  text-align: center;
  height: 49px;
  box-sizing: border-box;
}

.tab-button:hover {
  color: #000000;
}

.tab-button.active {
  color: #000000;
}

.active-indicator {
  position: absolute;
  bottom: 0;
  height: 4px;
  width: 84px;
  background-color: #f97316;
  transition: transform 0.3s ease;
  z-index: 2;
}

.filter-controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 48px;
  margin: 16px auto;
}

.filter-controls .tag-filter {
  height: 48px;
  min-width: 120px;
  min-height: 48px;
  max-height: 48px;
}

.filter-controls .tag-filter :deep(.el-select__wrapper) {
  border-radius: 8px;
}

.filter-controls .tag-filter :deep(.el-tooltip__trigger) {
  border-radius: 8px;
}

.filter-controls .tag-filter :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.filter-controls .tag-filter :deep(.el-select__caret) {
  color: #434343;
}


@media (max-width: 640px) {
  .list-controls {
    padding: 0 32px;
    box-sizing: border-box;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .filter-controls .tag-filter {
    width: 100%;
  }

}
</style>

