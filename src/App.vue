<template>
  <div class="app-shell">
    <header class="page-header">
      <div class="header-left">
        <h1>急需物資清單</h1>
        <span class="header-note"
          >填寫完需求請關閉頁面，以確保需求被確實送出</span
        >
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreate">
        新增物資需求
      </el-button>
    </header>

    <main class="page-main">
      <el-skeleton v-if="loading" class="loading" :rows="6" animated />

      <template v-else>
        <el-empty
          v-if="mergedRequests.length === 0"
          description="目前沒有物資需求"
        />

        <div v-else class="cards-grid">
          <el-card
            v-for="req in mergedRequests"
            :key="req.id"
            class="request-card"
            :class="cardClasses(req)"
            shadow="hover"
          >
            <div class="card-header">
              <div class="card-title">
                <h2>{{ req.org }}</h2>
                <div class="tags">
                  <el-tag
                    v-for="tag in cardTags(req)"
                    :key="tag.value"
                    size="small"
                    :style="{ backgroundColor: tag.color }"
                    effect="dark"
                  >
                    {{ tag.label }}
                  </el-tag>
                  <el-tag
                    size="small"
                    :type="requestStatus(req).type"
                    effect="dark"
                  >
                    {{ requestStatus(req).label }}
                  </el-tag>
                </div>
              </div>

              <div class="meta-row">
                <el-link
                  :href="mapLink(req.address)"
                  target="_blank"
                  :underline="false"
                >
                  <el-icon><Location /></el-icon>
                  <span class="meta-text">{{ req.address }}</span>
                </el-link>
              </div>

              <div class="meta-row muted">
                <div v-if="displayPhone(req)">
                  <el-icon><Phone /></el-icon>
                  <span class="meta-text">{{ displayPhone(req) }}</span>
                </div>
                <div>
                  <el-icon><Clock /></el-icon>
                  <span class="meta-text">發布時間：{{ formatTimeAgo(req.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="card-content">
              <div
                v-for="(item, index) in req.items"
                :key="`${req.id}-${index}`"
                class="item-row"
              >
                <div class="item-info">
                  <div class="item-title">
                    <span class="item-name">{{ item.name }}</span>
                    <el-tag
                      size="small"
                      :style="{ backgroundColor: typeMeta(item.type).color }"
                      effect="dark"
                    >
                      {{ typeMeta(item.type).label }}
                    </el-tag>
                  </div>
                  <div class="item-description">
                    <span>需求 {{ item.need }}{{ item.unit }}</span>
                    <span>
                      已收到 {{ item.got }}/{{ item.need }}{{ item.unit }}，還需要：
                      <strong class="need-number"
                        >{{ remainingNeed(item) }}{{ item.unit }}</strong
                      >
                    </span>
                  </div>
                </div>
                <el-progress
                  :percentage="progressPercentage(item)"
                  :status="itemProgressStatus(item)"
                />
              </div>
            </div>

            <template #footer>
              <div class="card-actions">
                <el-button
                  type="primary"
                  :icon="Van"
                  :disabled="isCompleted(req)"
                  @click="openDelivery(req)"
                >
                  我要配送
                </el-button>
              </div>
            </template>

            <div v-if="isCompleted(req)" class="card-stamp">已完成</div>
          </el-card>
        </div>
      </template>
    </main>

    <footer class="page-footer">
      若您有能力提供物資，請優先以「我要配送」填寫可支援的數量，感謝協助。
    </footer>

    <!-- Create Dialog -->
    <el-dialog
      v-model="createDialogVisible"
      title="物資需求"
      class="dialog-responsive"
      @closed="onCreateClosed"
    >
      <el-form label-position="top" class="form-grid">
        <el-form-item label="單位名稱" required>
          <el-input v-model.trim="createForm.org" placeholder="污泥暫置場" />
        </el-form-item>
        <el-form-item label="電話" required>
          <el-input
            v-model.trim="createForm.phone"
            placeholder="0912345678"
            type="tel"
          />
          <span class="hint">注意！電話將會公開在網路上，取得所需物資後將會自動隱藏</span>
        </el-form-item>
        <el-form-item label="地址" required>
          <el-input
            v-model.trim="createForm.address"
            placeholder="花蓮縣光復鄉..."
          />
        </el-form-item>
      </el-form>

      <section class="materials-section">
        <div class="materials-header">
          <h3>物資清單<span class="required">*</span></h3>
        </div>

        <div v-if="createForm.items.length === 0" class="items-empty">
          請新增至少一項物資需求
        </div>

        <div
          v-for="(item, index) in createForm.items"
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
          <el-input
            v-model.trim="item.name"
            placeholder="物資（瓶裝水）"
          />
          <el-input-number
            v-model="item.need"
            :min="1"
            :max="999999"
            controls-position="right"
            class="material-need-input"
          />
          <el-input
            v-model.trim="item.unit"
            placeholder="單位（箱）"
            class="material-unit-input"
          />
          <el-button
            v-if="createForm.items.length > 1"
            type="danger"
            link
            @click="removeCreateItem(index)"
          >
            移除
          </el-button>
        </div>

        <el-button type="primary" class="add-item-button" @click="addCreateItem">
          新增物資
        </el-button>
      </section>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!isCreateValid || submitting.create"
          @click="openCreateConfirm"
        >
          確認新增
        </el-button>
      </template>
    </el-dialog>

    <!-- Create Confirm -->
    <el-dialog
      v-model="createConfirmVisible"
      title="確認新增"
      width="620px"
    >
      <el-descriptions border :column="1" size="small">
        <el-descriptions-item label="單位名稱">
          {{ createPayload.org }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ createPayload.address }}
        </el-descriptions-item>
        <el-descriptions-item label="電話">
          {{ createPayload.phone }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table
        v-if="createSummaryItems.length > 0"
        :data="createSummaryItems"
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
          <template #default="{ row }">
            {{ row.need }}{{ row.unit }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="createConfirmVisible = false">返回修改</el-button>
        <el-button
          type="primary"
          :loading="submitting.create"
          @click="submitCreate"
        >
          送出
        </el-button>
      </template>
    </el-dialog>

    <!-- Delivery Dialog -->
    <el-dialog
      v-model="deliveryDialogVisible"
      title="物資配送"
      width="720px"
      @closed="onDeliveryClosed"
    >
      <p class="hint">目前物資需求進度</p>

      <el-empty
        v-if="deliveryDisplayItems.length === 0"
        description="此需求已完成"
      />

      <div v-else class="delivery-list">
        <div
          v-for="item in deliveryDisplayItems"
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
              :model-value="deliveryPicks[item.index] ?? 0"
              :min="0"
              :max="remainingNeed(item)"
              @update:model-value="(val) => setDeliveryPick(item.index, val)"
            />
            <el-button
              size="small"
              @click="setDeliveryPick(item.index, remainingNeed(item))"
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
            :disabled="deliveryDisplayItems.length === 0"
          >
            全部送達
          </el-button>
          <div class="footer-actions">
            <el-button @click="deliveryDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              :disabled="!canConfirmDelivery || submitting.delivery"
              @click="openDeliveryConfirm"
            >
              確認配送
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- Delivery Confirm -->
    <el-dialog
      v-model="deliveryConfirmVisible"
      title="確認配送"
      width="620px"
    >
      <el-descriptions
        v-if="deliveryTarget"
        border
        :column="1"
        size="small"
      >
        <el-descriptions-item label="配送到">
          {{ deliveryTarget.org }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ deliveryTarget.address }}
        </el-descriptions-item>
      </el-descriptions>

      <el-table
        v-if="deliverySummaryItems.length > 0"
        :data="deliverySummaryItems"
        border
        size="small"
        style="margin-top: 16px"
      >
        <el-table-column prop="name" label="物資" />
        <el-table-column label="配送數量" width="160">
          <template #default="{ row }">
            {{ row.qty }}{{ row.unit }}
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="deliveryConfirmVisible = false">返回修改</el-button>
        <el-button
          type="primary"
          :loading="submitting.delivery"
          @click="submitDelivery"
        >
          送出
        </el-button>
      </template>
    </el-dialog>

    <!-- Deliver All Confirm -->
    <el-dialog
      v-model="deliverAllConfirmVisible"
      title="確認全部送達"
      width="620px"
    >
      <el-descriptions
        v-if="deliveryTarget"
        border
        :column="1"
        size="small"
      >
        <el-descriptions-item label="配送到">
          {{ deliveryTarget.org }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ deliveryTarget.address }}
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
          :loading="submitting.delivery"
          @click="submitDeliverAll"
        >
          確認全部送達
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { ElMessage } from 'element-plus';
import { Clock, Location, Phone, Plus, Van } from '@element-plus/icons-vue';

const API_BASE_URL = 'https://guangfu250923.pttapp.cc';

const TYPE_MAP = {
  '食物/水': { label: '飲食', order: 0, color: '#ef4444' },
  醫療用品: { label: '醫療用品', order: 1, color: '#f59e0b' },
  生活用品: { label: '生活用品', order: 2, color: '#22c55e' },
  大型機具: { label: '大型機具', order: 3, color: '#3b82f6' },
  其他: { label: '其他', order: 4, color: '#a855f7' },
};

const typeOptions = Object.keys(TYPE_MAP).map((value) => ({
  value,
  label: TYPE_MAP[value].label,
}));

const requests = ref([]);
const loading = ref(false);
const submitting = reactive({
  create: false,
  delivery: false,
});

const createDialogVisible = ref(false);
const createConfirmVisible = ref(false);
const deliveryDialogVisible = ref(false);
const deliveryConfirmVisible = ref(false);
const deliverAllConfirmVisible = ref(false);

const createForm = reactive({
  org: '',
  phone: '',
  address: '',
  items: [],
});

const deliveryTarget = ref(null);
const deliveryPicks = reactive({});

const makeEmptyItem = () => ({
  type: '',
  name: '',
  need: 1,
  unit: '',
  got: 0,
});

const resetCreateForm = () => {
  createForm.org = '';
  createForm.phone = '';
  createForm.address = '';
  createForm.items.splice(0, createForm.items.length, makeEmptyItem());
};

const addCreateItem = () => {
  createForm.items.push(makeEmptyItem());
};

const removeCreateItem = (index) => {
  if (createForm.items.length <= 1) return;
  createForm.items.splice(index, 1);
};

const openCreate = () => {
  resetCreateForm();
  createDialogVisible.value = true;
};

const onCreateClosed = () => {
  createConfirmVisible.value = false;
};

const sanitizeItem = (item) => ({
  type: item.type,
  name: item.name?.trim() ?? '',
  need: Number.isFinite(Number(item.need)) ? Number(item.need) : 0,
  unit: item.unit?.trim() ?? '',
  got: Number.isFinite(Number(item.got)) ? Number(item.got) : 0,
});

const createItems = computed(() =>
  createForm.items.map((item) => sanitizeItem(item))
);

const createPayload = computed(() => ({
  org: createForm.org.trim(),
  phone: createForm.phone.trim(),
  address: createForm.address.trim(),
  items: createItems.value,
}));

const isCreateValid = computed(() => {
  const payload = createPayload.value;
  if (!payload.org || !payload.phone || !payload.address) return false;
  if (payload.items.length === 0) return false;
  return payload.items.every(
    (item) =>
      !!item.type &&
      !!item.name &&
      item.need >= 1 &&
      !!item.unit
  );
});

const createSummaryItems = computed(() =>
  createPayload.value.items.map((item) => ({
    name: item.name,
    typeLabel: typeMeta(item.type).label,
    need: item.need,
    unit: item.unit,
  }))
);

const openCreateConfirm = () => {
  if (!isCreateValid.value || submitting.create) return;
  createConfirmVisible.value = true;
};

const submitCreate = async () => {
  if (!isCreateValid.value || submitting.create) return;
  submitting.create = true;
  try {
    const payload = createPayload.value;
    await createRequest(payload);
    ElMessage.success(`已新增 ${payload.items.length} 個物資需求`);
    createConfirmVisible.value = false;
    createDialogVisible.value = false;
    await fetchRequests();
  } catch (error) {
    ElMessage.error(error.message || '新增需求失敗');
  } finally {
    submitting.create = false;
  }
};

const onDeliveryClosed = () => {
  deliveryConfirmVisible.value = false;
  deliverAllConfirmVisible.value = false;
  resetDeliveryPicks();
  deliveryTarget.value = null;
};

const resetDeliveryPicks = () => {
  Object.keys(deliveryPicks).forEach((key) => delete deliveryPicks[key]);
};

const openDelivery = (req) => {
  deliveryTarget.value = req;
  resetDeliveryPicks();
  deliveryDialogVisible.value = true;
};

const deliveryDisplayItems = computed(() => {
  if (!deliveryTarget.value) return [];
  return deliveryTarget.value.items
    .map((item, index) => ({ ...item, index }))
    .filter((item) => remainingNeed(item) > 0);
});

const canConfirmDelivery = computed(() =>
  Object.values(deliveryPicks).some((qty) => qty > 0)
);

const setDeliveryPick = (index, value) => {
  if (!deliveryTarget.value) return;
  const item = deliveryTarget.value.items[index];
  if (!item) return;
  const remain = remainingNeed(item);
  const val = clampNumber(Number(value) || 0, 0, remain);
  if (val > 0) {
    deliveryPicks[index] = val;
  } else {
    delete deliveryPicks[index];
  }
};

const deliverySummaryItems = computed(() => {
  if (!deliveryTarget.value) return [];
  return Object.entries(deliveryPicks)
    .filter(([, qty]) => qty > 0)
    .map(([idx, qty]) => {
      const index = Number(idx);
      const item = deliveryTarget.value.items[index];
      return {
        index,
        name: item?.name ?? '',
        unit: item?.unit ?? '',
        qty,
      };
    });
});

const deliverAllSummaryItems = computed(() => {
  if (!deliveryTarget.value) return [];
  return deliveryTarget.value.items
    .map((item, index) => ({ ...item, index, remain: remainingNeed(item) }))
    .filter((item) => item.remain > 0)
    .map((item) => ({
      index: item.index,
      name: item.name,
      remain: item.remain,
      unit: item.unit,
    }));
});

const openDeliveryConfirm = () => {
  if (!canConfirmDelivery.value || submitting.delivery) return;
  deliveryConfirmVisible.value = true;
};

const submitDelivery = async () => {
  if (!deliveryTarget.value || submitting.delivery) return;
  const summary = deliverySummaryItems.value;
  if (summary.length === 0) return;
  submitting.delivery = true;
  try {
    const deliveryData = {};
    summary.forEach((item) => {
      const original = deliveryTarget.value.items[item.index];
      const remain = remainingNeed(original);
      const newGot = Math.min(
        original.need,
        (original.got ?? 0) + Math.min(item.qty, remain)
      );
      deliveryData[item.index] = newGot;
    });
    await updateDeliveryProgress(deliveryTarget.value.id, deliveryData);
    ElMessage.success('已提交配送');
    deliveryConfirmVisible.value = false;
    deliveryDialogVisible.value = false;
    await fetchRequests();
  } catch (error) {
    ElMessage.error(error.message || '配送更新失敗');
  } finally {
    submitting.delivery = false;
  }
};

const openDeliverAllConfirm = () => {
  if (!deliveryTarget.value) return;
  if (deliverAllSummaryItems.value.length === 0) {
    ElMessage.info('此需求已全部完成');
    return;
  }
  deliverAllConfirmVisible.value = true;
};

const submitDeliverAll = async () => {
  if (!deliveryTarget.value || submitting.delivery) return;
  const summary = deliverAllSummaryItems.value;
  if (summary.length === 0) return;
  submitting.delivery = true;
  try {
    const deliveryData = {};
    summary.forEach((item) => {
      deliveryData[item.index] = deliveryTarget.value.items[item.index].need;
    });
    await updateDeliveryProgress(deliveryTarget.value.id, deliveryData);
    ElMessage.success('已標記全部送達');
    deliverAllConfirmVisible.value = false;
    deliveryDialogVisible.value = false;
    await fetchRequests();
  } catch (error) {
    ElMessage.error(error.message || '配送更新失敗');
  } finally {
    submitting.delivery = false;
  }
};

const mergedRequests = computed(() => {
  const merged = mergeRequestsByOrganization(requests.value);
  return merged.sort((a, b) => {
    const aCompleted = isCompleted(a);
    const bCompleted = isCompleted(b);
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    return 0;
  });
});

const cardTags = (req) => {
  const metas = [
    ...new Set(req.items.map((item) => typeMeta(item.type))),
  ];
  return metas
    .sort((a, b) => a.order - b.order)
    .map((meta) => ({
      label: meta.label,
      value: meta.label,
      color: meta.color,
    }));
};

const cardClasses = (req) => ({
  'is-completed': isCompleted(req),
  'has-medical': req.items.some((item) => item.type === '醫療用品'),
});

const displayPhone = (req) => {
  if (isCompleted(req)) return '';
  return req.phone ?? '';
};

const requestStatus = (req) => {
  if (isCompleted(req)) return { label: '已完成', type: 'success' };
  if (
    req.items.some(
      (item) => item.type === '醫療用品' && remainingNeed(item) > 0
    )
  ) {
    return { label: '緊急', type: 'danger' };
  }
  if (req.items.some((item) => remainingNeed(item) > 0)) {
    return { label: '尚缺', type: 'warning' };
  }
  return { label: '緊急', type: 'danger' };
};

const isCompleted = (req) =>
  req.items.every((item) => (item.got ?? 0) >= (item.need ?? 0));

const typeMeta = (type) => TYPE_MAP[type] ?? TYPE_MAP['其他'];

const remainingNeed = (item) =>
  Math.max(0, (item.need ?? 0) - (item.got ?? 0));

const progressPercentage = (item) => {
  if (!item.need || item.need <= 0) return 0;
  return Math.round(
    Math.max(0, Math.min(100, ((item.got ?? 0) / item.need) * 100))
  );
};

const itemProgressStatus = (item) => {
  if (remainingNeed(item) === 0) return 'success';
  return 'exception';
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '時間未知';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 0) return '剛剛';
  if (diff < 60) return '剛剛';
  if (diff < 3600) return `${Math.floor(diff / 60)}分鐘前`;
  const hours = Math.floor(diff / 3600);
  if (hours < 24) return `${hours}小時前`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days < 7) {
    return remainingHours === 0
      ? `${days}天前`
      : `${days}天${remainingHours}小時前`;
  }
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  if (weeks < 4) {
    return remainingDays === 0
      ? `${weeks}週前`
      : `${weeks}週${remainingDays}天前`;
  }
  const months = Math.floor(days / 30);
  const remainingWeeks = Math.floor((days % 30) / 7);
  if (months < 12) {
    return remainingWeeks === 0
      ? `${months}個月前`
      : `${months}個月${remainingWeeks}週前`;
  }
  const years = Math.floor(days / 365);
  const remainingMonths = Math.floor((days % 365) / 30);
  return remainingMonths === 0
    ? `${years}年前`
    : `${years}年${remainingMonths}個月前`;
};

const mapLink = (address) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;

const clampNumber = (value, min, max) => {
  const num = Number.isFinite(value) ? value : Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
};

const transformApiData = (apiData) =>
  apiData.map((item) => ({
    id: item.id,
    org: item.name || '未命名單位',
    address: item.address || '地址未提供',
    phone: item.phone || '',
    contact: item.contact || '',
    status: item.status || 'active',
    needed_people: item.needed_people || 1,
    notes: item.notes || '',
    lng: item.lng || 0,
    lat: item.lat || 0,
    map_link: item.map_link || '',
    created_at: item.created_at || Math.floor(Date.now() / 1000),
    time: item.time || 0,
    items: item.supplies
      ? item.supplies
          .filter((supply) => supply != null)
          .map((supply) => ({
            id: supply.id || '',
            name: supply.name || '未命名物資',
            type: supply.tag || '其他',
            need: supply.total_count || 1,
            got: supply.recieved_count || 0,
            unit: supply.unit || '個',
          }))
      : [],
  }));

const mergeRequestsByOrganization = (list) => {
  const mergedMap = new Map();
  list.forEach((req) => {
    const key = `${req.org}|${req.address}|${req.phone}`;
    const itemsWithSupplyId = req.items.map((item) => ({
      ...item,
      supplyId: req.id,
    }));
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key);
      existing.items.push(...itemsWithSupplyId);
      if (req.created_at > existing.created_at) {
        existing.created_at = req.created_at;
      }
    } else {
      mergedMap.set(key, {
        ...req,
        items: itemsWithSupplyId,
      });
    }
  });
  return Array.from(mergedMap.values());
};

const transformToApiData = (frontendData) => {
  if (frontendData.items.length === 0) {
    throw new Error('至少需要一個物資項目');
  }
  return {
    name: frontendData.org,
    address: frontendData.address,
    phone: frontendData.phone,
    supplies: {
      tag: frontendData.items[0].type,
      name: frontendData.items[0].name,
      recieved_count: frontendData.items[0].got,
      total_count: frontendData.items[0].need,
      unit: frontendData.items[0].unit,
    },
  };
};

const parseApiResponse = (data) => {
  if (!data) return [];
  if (data['@type'] === 'Collection' && Array.isArray(data.member)) {
    return transformApiData(data.member);
  }
  if (Array.isArray(data)) {
    return transformApiData(data);
  }
  return transformApiData([data]);
};

const fetchRequests = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE_URL}/supplies?embed=all`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    requests.value = parseApiResponse(data);
  } catch (error) {
    ElMessage.error(`無法載入需求資料: ${error.message}`);
  } finally {
    loading.value = false;
    requestAnimationFrame(adjustGoogleSitesHeight);
  }
};

const createRequest = async (payload) => {
  const promises = payload.items.map((item) => {
    const apiData = transformToApiData({ ...payload, items: [item] });
    return fetch(`${API_BASE_URL}/supplies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });
  });
  const responses = await Promise.all(promises);
  for (let i = 0; i < responses.length; i += 1) {
    const response = responses[i];
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`第 ${i + 1} 個物資新增失敗: HTTP ${response.status} - ${errorText}`);
    }
  }
};

const updateDeliveryProgress = async (requestId, deliveryData) => {
  const merged = mergeRequestsByOrganization(requests.value);
  const req = merged.find((item) => item.id === requestId);
  if (!req) {
    throw new Error('找不到指定的需求');
  }
  const deliveryBySupply = {};
  Object.entries(deliveryData).forEach(([indexStr, newGot]) => {
    const index = Number(indexStr);
    const item = req.items[index];
    if (!item) return;
    const supplyId = item.supplyId || requestId;
    if (!deliveryBySupply[supplyId]) {
      deliveryBySupply[supplyId] = [];
    }
    const count = newGot - (item.got ?? 0);
    if (count > 0) {
      deliveryBySupply[supplyId].push({ id: item.id, count });
    }
  });
  const promises = Object.entries(deliveryBySupply).map(([supplyId, items]) =>
    fetch(`${API_BASE_URL}/supplies/${supplyId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    })
  );
  const responses = await Promise.all(promises);
  for (let i = 0; i < responses.length; i += 1) {
    const response = responses[i];
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`配送失敗: HTTP ${response.status} - ${errorText}`);
    }
  }
};

const adjustGoogleSitesHeight = () => {
  const minHeight =
    window.innerWidth <= 480 ? 500 : window.innerWidth <= 768 ? 600 : 800;
  document.documentElement.style.minHeight = `${minHeight}px`;
  document.body.style.minHeight = `${minHeight}px`;
};

onMounted(() => {
  fetchRequests();
  adjustGoogleSitesHeight();
  window.addEventListener('resize', adjustGoogleSitesHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', adjustGoogleSitesHeight);
});

watch(mergedRequests, () => {
  requestAnimationFrame(adjustGoogleSitesHeight);
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  padding: 24px;
  background: #1e293b;
  color: #fff;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
}

.header-note {
  font-size: 0.9rem;
  color: #f87171;
  font-weight: 500;
}

.page-main {
  flex: 1;
  padding: 0 24px 24px;
}

.loading {
  margin-top: 48px;
}

.cards-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  max-width: 720px;
  margin: 0 auto;
}

.request-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  min-height: 100%;
}

.request-card.has-medical {
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.request-card.is-completed {
  background: #f3f4f6;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.meta-text {
  margin-left: 6px;
}

.muted {
  color: #6b7280;
}

.card-content {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-row {
  border-top: 1px dashed #e5e7eb;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row:first-of-type {
  border-top: none;
  padding-top: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-name {
  font-weight: 600;
  font-size: 1rem;
}

.item-description {
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  color: #4b5563;
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

.card-stamp {
  position: absolute;
  top: 16px;
  right: -24px;
  transform: rotate(12deg);
  padding: 6px 32px;
  font-weight: 700;
  border: 3px solid #22c55e;
  color: #15803d;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.12);
  font-size: 1rem;
}

.page-footer {
  padding: 0 24px 32px;
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  color: #6b7280;
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
  .cards-grid {
    max-width: 100%;
  }

  .material-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .material-row .el-button {
    justify-self: flex-start;
    padding-left: 0;
  }
}

:deep(.el-dialog.dialog-responsive) {
  width: min(720px, calc(100vw - 32px));
  max-width: 100%;
}

@media (max-width: 600px) {
  :deep(.el-dialog.dialog-responsive) {
    margin-top: 8vh;
  }
}

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
}

.delivery-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 960px) {
  .page-header {
    border-radius: 0;
  }

  .material-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-header {
    padding: 16px;
  }

  .page-main {
    padding: 0 16px 16px;
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .material-row {
    gap: 8px;
  }
}
</style>
