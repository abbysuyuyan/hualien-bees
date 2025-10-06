<template>
  <div class="app-shell">
    <!-- 主要頁面 -->
    <div v-if="!createDialogVisible" class="main-page">
      <main class="page-main">
        <RequestFilters
          v-model:activeTab="activeTab"
          v-model:selectedTag="selectedTag"
          v-model:showPendingOnly="showPendingOnly"
          :type-options="typeOptions"
        />

        <RequestList
          :requests="visibleRequests"
          :loading="loading"
          :loadin="loadingMore"
          :has-more="hasMore"
          :total-items="totalItems"
          :type-meta="typeMeta"
          :completed-collapsed="completedCollapsed"
          @delivery="openDelivery"
          @toggle-collapse="toggleCompletedCollapse"
          @load-more="loadMoreRequests"
        />
      </main>

      <footer class="page-footer">
        若您有能力提供物資，請優先以「我要配送」填寫可支援的數量，感謝協助。
      </footer>

      <!-- 固定底部按鈕 -->
      <div class="fixed-bottom-container">
        <el-button 
          class="fixed-bottom-button" 
          type="primary" 
          size="large"
          @click="openCreate"
        >
          我有物資需求
        </el-button>
      </div>
    </div>

    <!-- 新增物資需求頁面 -->
    <div v-else class="create-page">
      <CreateRequestPage
        :type-options="typeOptions"
        :type-meta="typeMeta"
        @submit="handleCreateSubmit"
        @close="createDialogVisible = false"
      />
    </div>

    <DeliveryDialog
      v-model="deliveryDialogVisible"
      :target="deliveryTarget"
      :type-meta="typeMeta"
      @submit="handleDeliverySubmit"
      @submit-all="handleDeliverAllSubmit"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import RequestFilters from './components/RequestFilters.vue';
import RequestList from './components/RequestList.vue';
import CreateRequestPage from './components/CreateRequestPage.vue';
import DeliveryDialog from './components/DeliveryDialog.vue';
import { useRequests } from './composables/useRequests.js';
import { useCreateRequest } from './composables/useCreateRequest.js';
import { useDelivery } from './composables/useDelivery.js';
import { useFilters } from './composables/useFilters.js';
import { useCompletedCollapse } from './composables/useCompletedCollapse.js';

// 主要狀態管理
const { requests, loading, loadingMore, hasMore, totalItems, fetchRequests } = useRequests();
const { submitting: createSubmitting, submitCreate } = useCreateRequest();
const { submitting: deliverySubmitting, submitDelivery, submitDeliverAll } = useDelivery();

// 篩選和顯示邏輯
const activeTab = ref("pending");
const selectedTag = ref("");
const { typeOptions, typeMeta, isCompleted, visibleRequests } = useFilters(
  requests, 
  activeTab,
  selectedTag
);

// 完成狀態摺疊管理
const { completedCollapsed, syncCompletedCollapseState, isCompletedCollapsed, toggleCompletedCollapse } = useCompletedCollapse(requests, isCompleted);

// Dialog 狀態
const createDialogVisible = ref(false);
const deliveryDialogVisible = ref(false);
const deliveryTarget = ref(null);

// 事件處理
const openCreate = () => {
  createDialogVisible.value = true;
};

const openDelivery = (req) => {
  deliveryTarget.value = req;
  deliveryDialogVisible.value = true;
};

const handleCreateSubmit = async (payload) => {
  try {
    await submitCreate(payload);
    await fetchRequests();
  } catch (error) {
    console.error('Create error:', error);
  }
};

const handleDeliverySubmit = async (target, summary) => {
  try {
    await submitDelivery(target, summary);
    await fetchRequests();
  } catch (error) {
    console.error('Delivery error:', error);
  }
};

const handleDeliverAllSubmit = async (target, summary) => {
  try {
    await submitDeliverAll(target, summary);
    await fetchRequests();
  } catch (error) {
    console.error('Deliver all error:', error);
  }
};

// 移除這些函數，因為現在使用 v-model 自動處理

const loadMoreRequests = () => {
  if (!hasMore.value || loading.value || loadingMore.value) return;
  fetchRequests({ append: true });
};

// 工具函數
const adjustGoogleSitesHeight = () => {
  const minHeight =
    window.innerWidth <= 480 ? 500 : window.innerWidth <= 768 ? 600 : 800;
  document.documentElement.style.minHeight = `${minHeight}px`;
  document.body.style.minHeight = `${minHeight}px`;
};

// 生命週期
onMounted(() => {
  fetchRequests();
  adjustGoogleSitesHeight();
  window.addEventListener("resize", adjustGoogleSitesHeight);
});

onUnmounted(() => {
  window.removeEventListener("resize", adjustGoogleSitesHeight);
});

// 監聽器
watch(visibleRequests, () => {
  syncCompletedCollapseState();
  requestAnimationFrame(adjustGoogleSitesHeight);
});

watch([activeTab, selectedTag], () => {
  requestAnimationFrame(adjustGoogleSitesHeight);
});

// 監聽新增頁面狀態，控制 body 滾動條
watch(createDialogVisible, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
html {
  font-size: 20px;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-main {
  flex: 1;
  padding: 0 24px 24px;
}

.page-footer {
  padding: 0 24px 129px;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
}

.fixed-bottom-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
}

.fixed-bottom-button {
  width: 100%;
  max-width: 335px;
  height: 48px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  background: #f8f9fa;
  overflow: hidden;
}

.main-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

@media (max-width: 640px) {
  .page-main {
    padding: 0;
  }
  
  .fixed-bottom-button {
    bottom: 16px;
    right: 16px;
    padding: 14px 20px;
    font-size: 0.95rem;
  }
}
</style>

