<template>
  <el-card
    class="request-card"
    :class="cardClasses"
    :shadow="isCompleted ? 'never' : 'hover'"
  >
    <div
      class="card-main"
      @click="handleCardClick"
    >
      <!-- 標題和發布時間 -->
      <div class="card-title">
        <h2>{{ request.org }}</h2>
        <div class="published-at">
          <span class="meta-text">{{ formatTimeAgo(request.created_at) }}</span>
        </div>
      </div>

      <!-- 標籤 -->
      <div class="tags">
        <el-tag
          v-for="tag in cardTags"
          :key="tag.value"
          size="small"
          class="custom-tag"
          effect="dark"
        >
          {{ tag.label }}
        </el-tag>
      </div>

      <div class="card-body">
        <div class="card-contact">
          <div class="section-title">聯絡資訊</div>
          <div class="contact-info">
            <el-link
              class="contact-row contact-link contact-link-map"
              :href="mapLink(request.address)"
              target="_blank"
              :underline="true"
              @click.stop
            >
              <el-icon><Location /></el-icon>
              <span class="meta-text">{{ request.address }}</span>
              <el-icon class="contact-link-icon"><TopRight /></el-icon>
            </el-link>
            <el-link
              v-if="displayPhone"
              class="contact-row contact-link contact-link-phone"
              :href="phoneHref(displayPhone)"
              :underline="false"
              @click.stop
            >
              <el-icon><Phone /></el-icon>
              <span class="meta-text">{{ displayPhone }}</span>
            </el-link>
          </div>
        </div>

        <div class="card-content">
          <div class="section-title">需求物資</div>
          <div
            v-for="(item, index) in request.items"
            :key="`${request.id}-${index}`"
            class="item-row"
            :class="{ 'is-fulfilled': isItemFulfilled(item) }"
          >
            <div class="item-info">
              <div class="item-title">{{ item.name }}</div>
              <div class="item-description">
                <div class="item-requirement">需求 {{ item.need }} {{ item.unit }}</div>
                <el-progress
                  :format="() => ''"
                  :percentage="progressPercentage(item)"
                  :stroke-width="8"
                  :show-text="false"
                  class="compact-progress"
                />
                <div class="item-progress">
                  <div>已收到 {{ item.got }} {{ item.unit }}</div>
                  <strong class="need-number">尚需 {{ remainingNeed(item) }} {{ item.unit }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div
        class="card-footer"
        @click="isCompleted ? handleCardClick : null"
      >
        <div v-if="!isCompleted" class="card-actions">
          <el-button
            type="primary"
            class="delivery-button"
            @click.stop="$emit('delivery', request)"
          >
            我要配送
          </el-button>
        </div>
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';
import { ArrowDown, Clock, Location, Phone, TopRight, Van } from "@element-plus/icons-vue";

const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  typeMeta: {
    type: Function,
    required: true
  },
  isCompletedCollapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delivery', 'toggle-collapse']);

// 計算屬性
const isCompleted = computed(() => 
  props.request.items.every((item) => (item.got ?? 0) >= (item.need ?? 0))
);

const cardClasses = computed(() => ({
  "is-completed": isCompleted.value,
  "has-medical": props.request.items.some((item) => item.type === "醫療用品"),
  "is-collapsed": props.isCompletedCollapsed,
}));

const cardTags = computed(() => {
  const metas = [...new Set(props.request.items.map((item) => props.typeMeta(item.type)))];
  return metas
    .sort((a, b) => a.order - b.order)
    .map((meta) => ({
      label: meta.label,
      value: meta.label,
      color: meta.color,
    }));
});

const requestStatus = computed(() => {
  if (isCompleted.value) return { label: "已完成", type: "success" };
  if (props.request.items.some((item) => item.type === "醫療用品" && remainingNeed(item) > 0)) {
    return { label: "緊急", type: "danger" };
  }
  if (props.request.items.some((item) => remainingNeed(item) > 0)) {
    return { label: "尚缺", type: "warning" };
  }
  return { label: "緊急", type: "danger" };
});

const displayPhone = computed(() => {
  if (isCompleted.value) return "";
  return props.request.phone ?? "";
});

// 方法
const remainingNeed = (item) => Math.max(0, (item.need ?? 0) - (item.got ?? 0));

const isItemFulfilled = (item) => remainingNeed(item) === 0;

const progressPercentage = (item) => {
  if (!item.need || item.need <= 0) return 0;
  return Math.round(Math.max(0, Math.min(100, ((item.got ?? 0) / item.need) * 100)));
};

const itemProgressStatus = (item) => {
  if (remainingNeed(item) === 0) return "success";
  return "exception";
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "時間未知";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 0) return "剛剛";
  if (diff < 60) return "剛剛";
  if (diff < 3600) return `${Math.floor(diff / 60)}分鐘前`;
  const hours = Math.floor(diff / 3600);
  if (hours < 24) return `${hours}小時前`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days < 7) {
    return remainingHours === 0 ? `${days}天前` : `${days}天${remainingHours}小時前`;
  }
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (weeks < 4) {
    return remainingDays === 0 ? `${weeks}週前` : `${weeks}週${remainingDays}天前`;
  }
  const months = Math.floor(days / 30);
  const remainingWeeks = Math.floor((days % 30) / 7);
  if (months < 12) {
    return remainingWeeks === 0 ? `${months}個月前` : `${months}個月${remainingWeeks}週前`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  return remainingMonths === 0 ? `${years}年前` : `${years}年${remainingMonths}個月前`;
};

const mapLink = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const phoneHref = (phone) => {
  if (!phone) return "";
  const sanitized = `${phone}`.replace(/[^0-9+#*]/g, "");
  return `tel:${sanitized || phone}`;
};

const handleCardClick = () => {
  if (!isCompleted.value) return;
  emit('toggle-collapse', props.request);
};
</script>

<style scoped>
.request-card {
  position: relative;
  overflow: visible;
  border-radius: 18px;
  min-height: 100%;
}

.request-card.has-medical {
  border: 2px solid rgba(239, 68, 68, 0.35);
}

.request-card.is-completed.has-medical {
  border: 2px solid rgba(239, 68, 68, 0.35);
}

.request-card.is-completed {
  border: 1px solid #cbd5f5;
  cursor: default;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.published-at {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #6b7280;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:deep(.el-tag) {
  border: none;
}

.meta-text {
  margin-left: 6px;
}

.card-contact {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
}

.card-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border-radius: 30px;
}

.request-card.is-completed :deep(.el-card__footer) {
  padding: 0;
}

.request-card :deep(.el-card__footer) {
  border-top: none;
}

.completed-toggle {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.completed-toggle-btn {
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: transparent;
  border-color: transparent;
  box-shadow: none;
}

.completed-toggle-btn .el-icon {
  font-size: 18px;
  color: #334155;
  transition: transform 0.2s ease, color 0.2s ease;
}

.completed-toggle-btn.is-expanded .el-icon {
  transform: rotate(180deg);
}

@media (hover: hover) {
  .completed-toggle-btn:hover {
    border-color: transparent;
  }

  .completed-toggle-btn:hover .el-icon,
  .request-card.is-completed:hover .completed-toggle-btn .el-icon {
    color: var(--el-color-primary);
  }
}

.section-title {
  height: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  position: relative;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  width: 100%;
}

.contact-row {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.9rem;
  color: #334155;
}

.contact-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-start;
  text-decoration: none;
}

.contact-link-map {
  text-decoration: underline;
  text-underline-offset: 3px;
  color: #F37C0E;
}

.contact-link-map:hover {
  color: #F37C0E;
}

.contact-link-icon {
  font-size: 1rem;
  margin-top: 0 !important;
}

.contact-link-phone {
  color: #F37C0E;
}

.contact-row :deep(.el-icon) {
  line-height: 1;
  margin-top: 2px;
}

.card-content {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
}

.item-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row + .item-row {
  border-top: 1px dashed #e5e7eb;
  padding-top: 12px;
}

.item-row.is-fulfilled + .item-row {
  border-top: none;
}

.item-row.is-fulfilled .item-name {
  color: #4b5563;
}

.item-row.is-fulfilled .item-description,
.item-row.is-fulfilled .need-number {
  color: #434343;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 12px;
  border: 1px solid #E6E6E6;
  padding: 12px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  font-size: 1rem;
  color: #434343;
}

.item-description {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  color: #434343;
  gap: 4px;
  width: 100%;
}

.item-requirement {
  height: 20px;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
}

.need-number {
  color: #ef4444;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

@media (min-width: 768px) {
  .item-description {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .item-description span:last-child {
    text-align: right;
    margin-right: 56px;
  }
}

.custom-tag {
  height: 28px;
  padding: 8px 12px;
  border-radius: 1000px;
  color: #434343 !important;
  background-color: #F4F4F5 !important;
  font-weight: 500;
}

.compact-progress {
  margin: 0;
  line-height: 1;
}

.compact-progress :deep(.el-progress__text) {
  display: none !important;
}

.compact-progress :deep(.el-progress-bar__outer) {
  margin-right: 0 !important;
}

.item-progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  font-size: 0.9rem;
  color: #64748b;
  width: 100%;
}

.delivery-button {
  height: 48px;
  min-height: 48px;
  min-width: 303px;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  gap: 8px;
  background: #F37C0E;
}

.delivery-button:hover {
  background: #F37C0E;
  opacity: 0.8;
}

.delivery-button:active {
  background: #F37C0E;
}
</style>

