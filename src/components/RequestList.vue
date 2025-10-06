<template>
  <div class="request-list">
    <el-skeleton v-if="loading" class="loading" :rows="6" animated />

    <template v-else>
      <div v-if="requests.length > 0" class="cards-grid">
        <RequestCard
          v-for="req in requests"
          :key="req.id"
          :request="req"
          :type-meta="typeMeta"
          :is-completed-collapsed="isCompletedCollapsed(req)"
          @delivery="$emit('delivery', $event)"
          @toggle-collapse="$emit('toggle-collapse', $event)"
        />
      </div>

      <div v-else-if="loadingMore || hasMore" class="loading-placeholder">
        <el-skeleton :rows="1" animated />
      </div>

      <el-empty v-else description="目前沒有物資需求" />

      <div
        v-if="supportsIntersectionObserver"
        ref="loadMoreTrigger"
        class="infinite-scroll-trigger"
      />

      <div v-if="loadingMore" class="loading-more">
        <el-skeleton :rows="1" animated />
      </div>

      <div v-else-if="!hasMore && requests.length > 0" class="no-more">
        已載入全部需求<span v-if="totalItems">（共 {{ totalItems }} 筆）</span>
      </div>

      <div
        v-if="!supportsIntersectionObserver && hasMore && !loadingMore"
        class="load-more-fallback"
      >
        <el-button
          type="primary"
          plain
          size="small"
          @click="$emit('load-more')"
        >
          載入更多
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import RequestCard from './RequestCard.vue';

const props = defineProps({
  requests: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  totalItems: {
    type: Number,
    default: 0
  },
  typeMeta: {
    type: Function,
    required: true
  },
  completedCollapsed: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['delivery', 'toggle-collapse', 'load-more']);

const supportsIntersectionObserver = typeof window !== "undefined" && "IntersectionObserver" in window;

const isCompletedCollapsed = (req) => {
  const state = props.completedCollapsed[req.id];
  return state === undefined ? true : state;
};
</script>

<style scoped>
.loading {
  margin-top: 48px;
}

.loading-placeholder,
.loading-more {
  max-width: 520px;
  margin: 32px auto 0;
}

.no-more {
  text-align: center;
  color: #64748b;
  margin: 24px 0 48px;
  font-size: 0.95rem;
}

.infinite-scroll-trigger {
  width: 100%;
  height: 1px;
}

.load-more-fallback {
  display: flex;
  justify-content: center;
  margin: 24px 0 48px;
}

.cards-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  max-width: 720px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .cards-grid {
    max-width: 100%;
  }
}
</style>

