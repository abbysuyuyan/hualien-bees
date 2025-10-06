<template>
  <el-dialog
    v-model="visible"
    title="物資配送"
    class="dialog-responsive delivery-dialog"
    @closed="onClosed"
  >
    <p class="hint">目前物資需求進度</p>

    <el-empty
      v-if="displayItems.length === 0"
      description="此需求已完成"
    />

    <div v-else class="delivery-list">
      <div
        v-for="item in displayItems"
        :key="`deliver-${item.index}`"
        class="deliver-card"
      >
        <div class="deliver-header">
          <div class="deliver-title">
            <strong>{{ item.name }}</strong>
            <el-tag size="small">{{ typeMeta(item.type).label }}</el-tag>
          </div>
          <span class="muted">尚缺 {{ remainingNeed(item) }}{{ item.unit }}</span>
        </div>
        <el-progress
          :percentage="progressPercentage(item)"
          :status="itemProgressStatus(item)"
          :text-inside="true"
          stroke-width="18"
        />
        <div class="deliver-actions">
          <el-input-number
            class="deliver-input"
            :model-value="picks[item.index] ?? 0"
            :min="0"
            :max="remainingNeed(item)"
            @update:model-value="(val) => setPick(item.index, val)"
          />
          <el-button
            size="small"
            @click="setPick(item.index, remainingNeed(item))"
          >
            MAX
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="delivery-footer">
        <el-button
          type="primary"
          text
          @click="openDeliverAllConfirm"
          :disabled="displayItems.length === 0"
        >
          全部送達
        </el-button>
        <div class="footer-actions">
          <el-button @click="visible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="!canConfirm || submitting"
            @click="openConfirm"
          >
            確認配送
          </el-button>
        </div>
      </div>
    </template>

    <!-- Delivery Confirm -->
    <el-dialog
      v-model="confirmVisible"
      title="確認配送"
      class="dialog-responsive dialog-confirm"
    >
      <el-descriptions v-if="target" border :column="1" size="small">
        <el-descriptions-item label="配送到">
          {{ target.org }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ target.address }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table
        v-if="summaryItems.length > 0"
        :data="summaryItems"
        border
        size="small"
        style="margin-top: 16px"
      >
        <el-table-column prop="name" label="物資" />
        <el-table-column label="配送數量" width="160">
          <template #default="{ row }"> {{ row.qty }}{{ row.unit }} </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="confirmVisible = false">返回修改</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submit"
        >
          送出
        </el-button>
      </template>
    </el-dialog>

    <!-- Deliver All Confirm -->
    <el-dialog
      v-model="deliverAllConfirmVisible"
      title="確認全部送達"
      class="dialog-responsive dialog-confirm"
    >
      <el-descriptions v-if="target" border :column="1" size="small">
        <el-descriptions-item label="配送到">
          {{ target.org }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ target.address }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table
        v-if="deliverAllSummaryItems.length > 0"
        :data="deliverAllSummaryItems"
        border
        size="small"
        style="margin-top: 16px"
      >
        <el-table-column prop="name" label="物資" />
        <el-table-column label="尚缺數量" width="160">
          <template #default="{ row }">
            {{ row.remain }}{{ row.unit }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="deliverAllConfirmVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submitDeliverAll"
        >
          確認全部送達
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  target: {
    type: Object,
    default: null
  },
  typeMeta: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'submit', 'submit-all']);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const picks = reactive({});
const confirmVisible = ref(false);
const deliverAllConfirmVisible = ref(false);
const submitting = ref(false);

const displayItems = computed(() => {
  if (!props.target) return [];
  return props.target.items
    .map((item, index) => ({ ...item, index }))
    .filter((item) => remainingNeed(item) > 0);
});

const canConfirm = computed(() =>
  Object.values(picks).some((qty) => qty > 0)
);

const remainingNeed = (item) => Math.max(0, (item.need ?? 0) - (item.got ?? 0));

const progressPercentage = (item) => {
  if (!item.need || item.need <= 0) return 0;
  return Math.round(Math.max(0, Math.min(100, ((item.got ?? 0) / item.need) * 100)));
};

const itemProgressStatus = (item) => {
  if (remainingNeed(item) === 0) return "success";
  return "exception";
};

const setPick = (index, value) => {
  if (!props.target) return;
  const item = props.target.items[index];
  if (!item) return;
  const remain = remainingNeed(item);
  const val = clampNumber(Number(value) || 0, 0, remain);
  if (val > 0) {
    picks[index] = val;
  } else {
    delete picks[index];
  }
};

const clampNumber = (value, min, max) => {
  const num = Number.isFinite(value) ? value : Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
};

const summaryItems = computed(() => {
  if (!props.target) return [];
  return Object.entries(picks)
    .filter(([, qty]) => qty > 0)
    .map(([idx, qty]) => {
      const index = Number(idx);
      const item = props.target.items[index];
      return {
        index,
        name: item?.name ?? "",
        unit: item?.unit ?? "",
        qty,
      };
    });
});

const deliverAllSummaryItems = computed(() => {
  if (!props.target) return [];
  return props.target.items
    .map((item, index) => ({ ...item, index, remain: remainingNeed(item) }))
    .filter((item) => item.remain > 0)
    .map((item) => ({
      index: item.index,
      name: item.name,
      remain: item.remain,
      unit: item.unit,
    }));
});

const openConfirm = () => {
  if (!canConfirm.value || submitting.value) return;
  confirmVisible.value = true;
};

const submit = async () => {
  if (!props.target || submitting.value) return;
  const summary = summaryItems.value;
  if (summary.length === 0) return;
  submitting.value = true;
  try {
    await emit('submit', props.target, summary);
    confirmVisible.value = false;
    visible.value = false;
  } catch (error) {
    console.error('Submit error:', error);
  } finally {
    submitting.value = false;
  }
};

const openDeliverAllConfirm = () => {
  if (!props.target) return;
  if (deliverAllSummaryItems.value.length === 0) {
    return;
  }
  deliverAllConfirmVisible.value = true;
};

const submitDeliverAll = async () => {
  if (!props.target || submitting.value) return;
  const summary = deliverAllSummaryItems.value;
  if (summary.length === 0) return;
  submitting.value = true;
  try {
    await emit('submit-all', props.target, summary);
    deliverAllConfirmVisible.value = false;
    visible.value = false;
  } catch (error) {
    console.error('Submit all error:', error);
  } finally {
    submitting.value = false;
  }
};

const resetPicks = () => {
  Object.keys(picks).forEach((key) => delete picks[key]);
};

const onClosed = () => {
  confirmVisible.value = false;
  deliverAllConfirmVisible.value = false;
  resetPicks();
};

watch(visible, (newVal) => {
  if (newVal) {
    resetPicks();
  }
});
</script>

<style scoped>
.delivery-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.deliver-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
}

.deliver-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.deliver-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.deliver-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
  margin-left: auto;
  flex-wrap: nowrap;
}

.deliver-actions :deep(.el-button) {
  white-space: nowrap;
}

.delivery-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.deliver-input {
  width: 160px;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.muted {
  color: #6b7280;
}

@media (max-width: 640px) {
  .deliver-card {
    padding: 14px;
  }

  .deliver-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .deliver-actions {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
  }

  .deliver-input {
    flex: 1;
    min-width: 140px;
    max-width: 220px;
  }
}

@media (max-width: 640px) {
  .footer-actions {
    gap: 0;
  }
}

:deep(.el-dialog.dialog-responsive) {
  width: min(720px, calc(100vw - 32px));
  max-width: 100%;
}

:deep(.el-dialog.dialog-confirm) {
  width: min(520px, calc(100vw - 32px));
}

:deep(.el-dialog.dialog-confirm .el-dialog__body) {
  max-height: min(70vh, 520px);
  overflow-y: auto;
}

@media (max-width: 600px) {
  :deep(.el-dialog.dialog-responsive) {
    margin-top: 8vh;
  }

  :deep(.el-dialog.dialog-confirm) {
    margin-top: 12vh;
  }
}
</style>

