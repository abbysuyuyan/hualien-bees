<template>
  <div class="create-page-container">
    <!-- 頁面標題列 -->
    <div class="page-header">
      <el-button 
        type="text" 
        class="back-button"
        @click="$emit('close')"
      >
        <el-icon>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 7H3.83L9.42 1.41L8 0L0 8L8 16L9.41 14.59L3.83 9H16V7Z" fill="#3A3937"/>
          </svg>
        </el-icon>
      </el-button>
      <h1 class="page-title">新增物資需求</h1>
    </div>

    <!-- 表單內容 -->
    <div class="page-content">
      <div class="form-container">
        <div class="form-field">
          <label class="form-label">單位名稱</label>
          <input 
            v-model.trim="form.org" 
            type="text" 
            placeholder="污泥暫置場"
            class="form-input"
          />
        </div>
        
        <div class="form-field">
          <label class="form-label">手機號碼</label>
          <input 
            v-model.trim="form.phone" 
            type="tel" 
            placeholder="0987654321"
            class="form-input"
          />
          <div class="phone-hint">
            <el-icon class="warning-icon"><WarningFilled /></el-icon>
            填寫電話可幫助資訊傳遞,將會公開在網路上,取得所需物資後會自動隱藏
          </div>
        </div>
        
        <div class="form-field">
          <label class="form-label">地址</label>
          <input 
            v-model.trim="form.address" 
            type="text" 
            placeholder="花蓮縣光復鄉"
            class="form-input"
          />
        </div>
      </div>

      <!-- 物資清單區塊 -->
      <section class="materials-section">
        <div class="materials-header">
          <h3>物資清單<span class="required">*</span></h3>
        </div>

        <div
          v-for="(item, index) in form.items"
          :key="`create-${index}`"
          class="material-item"
        >
          <div class="material-row">
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
            
            <input 
              v-model.trim="item.name" 
              type="text"
              placeholder="輸入物資名稱"
              class="material-name-input"
            />
          </div>
          
          <div class="material-row">
            <div class="quantity-selector">
              <button 
                type="button"
                class="quantity-btn minus"
                @click="decreaseQuantity(index)"
              >
                <svg width="14" height="2" viewBox="0 0 14 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H0V0H14V2Z" fill="#3A3937"/>
                </svg>
              </button>
              <input 
                v-model.number="item.need" 
                type="number"
                :min="1"
                class="quantity-input"
              />
              <button 
                type="button"
                class="quantity-btn plus"
                @click="increaseQuantity(index)"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 7.42857H7.42857V13H5.57143V7.42857H0V5.57143H5.57143V0H7.42857V5.57143H13V7.42857Z" fill="#3A3937"/>
                </svg>
              </button>
            </div>
            
            <input
              v-model.trim="item.unit"
              type="text"
              placeholder="輸入單位,例如:盒"
              class="material-unit-input"
            />
          </div>
          
          <!-- 只有當物資項目超過1個時才顯示移除按鈕 -->
          <button
            v-if="form.items.length > 1"
            type="button"
            class="remove-button"
            @click="removeItem(index)"
          >
            <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 0V1H0V3H1V16C1 16.5304 1.21071 17.0391 1.58579 17.4142C1.96086 17.7893 2.46957 18 3 18H13C13.5304 18 14.0391 17.7893 14.4142 17.4142C14.7893 17.0391 15 16.5304 15 16V3H16V1H11V0H5ZM3 3H13V16H3V3ZM5 5V14H7V5H5ZM9 5V14H11V5H9Z" fill="#D34746"/>
            </svg>
            移除
          </button>
        </div>

        <button
          type="button"
          class="add-item-button"
          @click="addItem"
        >
          <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.5 8H8.5V14H6.5V8H0.5V6H6.5V0H8.5V6H14.5V8Z" fill="#3A3937"/>
          </svg>
          新增物資清單
        </button>
      </section>

      <!-- 服務條款 -->
      <el-checkbox v-model="policyAccepted" class="policy-checkbox">
        我已理解本平台
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
    </div>

    <!-- 底部按鈕 -->
    <div class="page-footer">
      <el-button 
        class="cancel-button"
        @click="$emit('close')"
      >
        取消
      </el-button>
      <el-button
        type="primary"
        class="submit-button"
        :disabled="!isValid || submitting"
        :loading="submitting"
        @click="submit"
      >
        確認新增
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Plus, WarningFilled, ArrowLeft } from "@element-plus/icons-vue";

const props = defineProps({
  typeOptions: {
    type: Array,
    default: () => []
  },
  typeMeta: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['submit', 'close']);

const form = reactive({
  org: "",
  phone: "",
  address: "",
  items: [],
});

const policyAccepted = ref(false);
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

const increaseQuantity = (index) => {
  form.items[index].need = Math.min(999999, form.items[index].need + 1);
};

const decreaseQuantity = (index) => {
  form.items[index].need = Math.max(1, form.items[index].need - 1);
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
  if (!data.org || !data.address || !data.phone) return false;
  if (data.items.length === 0) return false;
  if (!policyAccepted.value) return false;
  return data.items.every(
    (item) => !!item.type && !!item.name && item.need >= 1
  );
});

const submit = async () => {
  if (!isValid.value || submitting.value) return;
  submitting.value = true;
  try {
    await emit('submit', payload.value);
    resetForm();
  } catch (error) {
    console.error('Submit error:', error);
  } finally {
    submitting.value = false;
  }
};

// 初始化表單
resetForm();
</script>

<style scoped>
/* ===== 主要容器 ===== */
.create-page-container {
  height: 100dvh;
  overflow-y: auto;
}

/* ===== 頁面標題列 ===== */
.page-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  padding: 8px;
  font-size: 1.2rem;
}

.page-title {
  margin: 0;
  width: 263px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

/* ===== 頁面內容 ===== */
.page-content {
  padding: 24px;
  width: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

/* ===== 表單容器 ===== */
.form-container {
  border-radius: 12px;
  margin-bottom: 24px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.form-field {
  margin-bottom: 16px;
}

.form-field:last-child {
  margin-bottom: 0;
}

/* ===== 表單標籤 ===== */
.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
  color: #374151;
}

.form-label::after {
  content: '*';
  color: #ef4444;
  margin-left: 2px;
}

/* ===== 表單輸入框 ===== */
.form-input {
  width: 100%;
  height: 48px;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid #838383;
  border-radius: 8px;
  font-size: 16px;
  line-height: 20px;
  color: #374151;
  background: white;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* ===== 提示文字 ===== */
.phone-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  font-size: 14px;
  line-height: 20px;
  color: #D34746;
}

.warning-icon {
  width: 16px;
  height: 16px;
}

/* ===== 物資清單區塊 ===== */
.materials-section {
  background: white;
  margin-bottom: 24px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.materials-header {
  margin-bottom: 20px;
}

.materials-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.required {
  color: #ef4444;
  margin-left: 4px;
}

/* ===== 物資項目 ===== */
.material-item {
  margin-bottom: 16px;
  position: relative;
}

.material-item + .material-item {
  border-top: 1px dashed #434343;
  border-image: repeating-linear-gradient(to right, #434343 0, #434343 8px, transparent 8px, transparent 16px) 1;
  padding-top: 24px;
  margin-top: 24px;
}

.material-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.material-row:last-child {
  margin-bottom: 0;
}

/* ===== 物資類型選擇器 ===== */
:deep(.material-type-select .el-select__wrapper.el-tooltip__trigger) {
  height: 48px;
  border-radius: 8px;
  border: 1px solid #838383;
  box-shadow: none !important;
  font-size: 16px;
  line-height: 20px;
  color: #374151;
  background: white;
  transition: border-color 0.2s ease;
}

:deep(.material-type-select .el-select__wrapper.el-tooltip__trigger.is-focused) {
  box-shadow: none;
  border-color: #3b82f6;
}

:deep(.material-type-select .el-select__wrapper.el-tooltip__trigger:hover) {
  border-color: #3b82f6;
}

/* ===== 物資輸入框 ===== */
.material-name-input,
.material-unit-input {
  flex: 1;
  height: 48px;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid #838383;
  border-radius: 8px;
  font-size: 16px;
  line-height: 20px;
  color: #374151;
  background: white;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.material-name-input:focus,
.material-unit-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.material-name-input::placeholder,
.material-unit-input::placeholder {
  color: #9ca3af;
}

.material-type-select {
  flex: 1;
  height: 48px;
}

/* ===== 數量選擇器 ===== */
.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid #E6E6E6;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  width: 100%;
}

.quantity-btn {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  background: #f8f9fa;
  border: none;
  color: #374151;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.quantity-btn:hover {
  background: #e5e7eb;
}

.quantity-input {
  flex: 1;
  height: 48px;
  text-align: center;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 20px;
  color: #374151;
  background: white;
  padding: 0;
}

/* ===== 按鈕樣式 ===== */
.remove-button {
  width: 100%;
  height: 40px;
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #ef4444;
  border-radius: 8px;
  background: white;
  color: #ef4444;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.remove-button:hover {
  background: #fef2f2;
  border-color: #dc2626;
}

.add-item-button {
  width: 100%;
  height: 48px;
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #E6E6E6;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.add-item-button:hover {
  background: #f8f9fa;
}

.plus-icon {
  font-size: 1.2rem;
  font-weight: 600;
}

/* ===== 政策條款 ===== */
.policy-checkbox {
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  font-size: 16px;
  line-height: 20px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

:deep(.policy-checkbox .el-checkbox__input .el-checkbox__inner) {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

:deep(.policy-checkbox .el-checkbox__label) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 16px;
  line-height: 20px;
}

:deep(.policy-checkbox .el-checkbox__label .el-link) {
  font-size: 16px;
  line-height: 20px;
}

.required-icon {
  color: #ef4444;
  font-weight: 700;
}

/* ===== 頁面底部 ===== */
.page-footer {
  background: white;
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.cancel-button {
  flex: 1;
  height: 48px;
  min-height: 48px;
  font-size: 1rem;
  border-radius: 12px;
  margin: 0;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background: #F3F4F6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.submit-button {
  flex: 1;
  height: 48px;
  min-height: 48px;
  font-size: 1rem;
  font-weight: 600;
  background: #F37C0E;
  border-radius: 12px;
  color: white;
  border: none;
  margin: 0;
  transition: all 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  background: #E66A00;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(243, 124, 14, 0.3);
}

.submit-button:disabled {
  background: #D1D5DB;
  color: #9CA3AF;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ===== 響應式設計 ===== */
@media (max-width: 640px) {
  .page-content {
    padding: 16px;
  }
  
  .page-header {
    padding: 12px 16px;
  }
  
  .page-footer {
    padding: 12px 16px;
    flex-direction: column;
  }
  
  .page-footer .submit-button {
    order: -1;
  }
  
  .material-row {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .material-type-select,
  .material-name-input,
  .material-unit-input {
    width: 100%;
  }
  
  .quantity-selector {
    width: 100%;
    justify-content: center;
  }
  
  .remove-button {
    width: 100%;
  }
}
</style>
