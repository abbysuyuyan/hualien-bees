<template>
  <el-dialog
    v-model="visible"
    title="物資需求"
    class="dialog-responsive"
    @closed="onClosed"
  >
    <el-form label-position="top" class="form-grid">
      <el-form-item label="單位名稱" required>
        <el-input v-model.trim="form.org" placeholder="污泥暫置場" />
      </el-form-item>
      <el-form-item label="電話">
        <el-input
          v-model.trim="form.phone"
          placeholder="0912345678"
          type="tel"
        />
        <span class="hint with-icon">
          <el-icon><WarningFilled /></el-icon>
          填寫電話可幫助資訊傳遞，將會公開在網路上，取得所需物資後會自動隱藏
        </span>
      </el-form-item>
      <el-form-item label="地址" required>
        <el-input
          v-model.trim="form.address"
          placeholder="花蓮縣光復鄉..."
        />
      </el-form-item>
    </el-form>

    <section class="materials-section">
      <div class="materials-header">
        <h3>物資清單<span class="required">*</span></h3>
      </div>

      <div v-if="form.items.length === 0" class="items-empty">
        請新增至少一項物資需求
      </div>

      <div
        v-for="(item, index) in form.items"
        :key="`create-${index}`"
        class="material-row"
      >
        <el-select
          v-model="item.type"
          placeholder="選擇類型"
          class="material-type-select"
        >
          <el-option
            v-for="option in typeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-input v-model.trim="item.name" placeholder="物資（瓶裝水）" />
        <el-input-number
          v-model="item.need"
          :min="1"
          :max="999999"
          class="material-need-input"
        />
        <el-input
          v-model.trim="item.unit"
          placeholder="單位（箱）"
          class="material-unit-input"
        />
        <el-button
          v-if="form.items.length > 1"
          type="danger"
          link
          @click="removeItem(index)"
        >
          移除
        </el-button>
      </div>

      <el-button
        type="primary"
        class="add-item-button"
        :icon="Plus"
        @click="addItem"
      >
        新增物資
      </el-button>
    </section>

    <el-checkbox v-model="policyAccepted" class="policy-checkbox">
      <span class="required-icon">*</span>我已理解本平台
      <el-link
        href="https://docs.google.com/document/d/1JOjahSi5om1Gx4mydQ8FiOzZMVwLGimY5NPz6-BWZKw/edit?usp=sharing"
        target="_blank"
        type="primary"
        :underline="false"
      >
        服務政策
      </el-link>
      及
      <el-link
        href="https://sites.google.com/view/guangfu250923/Policy?authuser=0"
        target="_blank"
        type="primary"
        :underline="false"
      >
        隱私權條款
      </el-link>
      之使用
    </el-checkbox>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!isValid || submitting"
        @click="openConfirm"
      >
        確認新增
      </el-button>
    </template>

    <!-- Confirm Dialog -->
    <el-dialog
      v-model="confirmVisible"
      title="確認新增"
      class="dialog-responsive dialog-confirm"
    >
      <el-descriptions border :column="1" size="small">
        <el-descriptions-item label="單位名稱">
          {{ payload.org }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ payload.address }}
        </el-descriptions-item>
        <el-descriptions-item label="電話">
          {{ payload.phone }}
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
        <el-table-column label="類型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.typeLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="need" label="需求數量" width="120">
          <template #default="{ row }"> {{ row.need }}{{ row.unit }} </template>
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
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Plus, WarningFilled } from "@element-plus/icons-vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  typeOptions: {
    type: Array,
    default: () => []
  },
  typeMeta: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'submit']);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const form = reactive({
  org: "",
  phone: "",
  address: "",
  items: [],
});

const policyAccepted = ref(false);
const confirmVisible = ref(false);
const submitting = ref(false);

const makeEmptyItem = () => ({
  type: "",
  name: "",
  need: 1,
  unit: "",
  got: 0,
});

const resetForm = () => {
  form.org = "";
  form.phone = "";
  form.address = "";
  form.items.splice(0, form.items.length, makeEmptyItem());
  policyAccepted.value = false;
};

const addItem = () => {
  form.items.push(makeEmptyItem());
};

const removeItem = (index) => {
  if (form.items.length <= 1) return;
  form.items.splice(index, 1);
};

const sanitizeItem = (item) => ({
  type: item.type,
  name: item.name?.trim() ?? "",
  need: Number.isFinite(Number(item.need)) ? Number(item.need) : 0,
  unit: item.unit?.trim() ?? "",
  got: Number.isFinite(Number(item.got)) ? Number(item.got) : 0,
});

const items = computed(() =>
  form.items.map((item) => sanitizeItem(item))
);

const payload = computed(() => ({
  org: form.org.trim(),
  phone: form.phone.trim(),
  address: form.address.trim(),
  items: items.value,
}));

const isValid = computed(() => {
  const data = payload.value;
  if (!data.org || !data.address) return false;
  if (data.items.length === 0) return false;
  if (!policyAccepted.value) return false;
  return data.items.every(
    (item) => !!item.type && !!item.name && item.need >= 1 && !!item.unit
  );
});

const summaryItems = computed(() =>
  payload.value.items.map((item) => ({
    name: item.name,
    typeLabel: props.typeMeta(item.type).label,
    need: item.need,
    unit: item.unit,
  }))
);

const openConfirm = () => {
  if (!isValid.value || submitting.value) return;
  confirmVisible.value = true;
};

const submit = async () => {
  if (!isValid.value || submitting.value) return;
  submitting.value = true;
  try {
    await emit('submit', payload.value);
    confirmVisible.value = false;
    visible.value = false;
  } catch (error) {
    console.error('Submit error:', error);
  } finally {
    submitting.value = false;
  }
};

const onClosed = () => {
  confirmVisible.value = false;
  policyAccepted.value = false;
  resetForm();
};

watch(visible, (newVal) => {
  if (newVal) {
    resetForm();
  }
});
</script>

<style scoped>
.form-grid {
  display: flex;
  flex-direction: column;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.hint.with-icon {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}

.hint.with-icon :deep(.el-icon) {
  margin-top: 2px;
  flex-shrink: 0;
}

.policy-checkbox {
  margin-top: 28px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
}

.policy-checkbox :deep(.el-checkbox__label) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.required-icon {
  color: #ef4444;
  font-weight: 700;
}

.materials-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.materials-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}

.materials-header h3 {
  margin: 0;
  font-size: 1rem;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

.items-empty {
  padding: 16px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  text-align: center;
  color: #6b7280;
}

.material-row {
  display: grid;
  grid-template-columns: 150px 1fr 120px 120px auto;
  gap: 12px;
  align-items: center;
}

.material-row > * {
  width: 100%;
}

.el-button {
  padding: 20px 24px;
  font-size: 1rem;
}

.material-row .el-button {
  justify-self: end;
}

.material-type-select,
.material-need-input,
.material-unit-input {
  width: 100%;
}

.add-item-button {
  width: 100%;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .material-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .material-row .el-button {
    justify-self: flex-start;
    padding-left: 0;
  }
}

@media (max-width: 600px) {
  .material-row + .material-row {
    border-top: 1px dashed #e2e8f0;
    padding-top: 12px;
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

