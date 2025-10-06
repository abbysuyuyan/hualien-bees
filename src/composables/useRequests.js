import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const API_BASE_URL = "https://guangfu250923.pttapp.cc";

export function useRequests() {
  const requests = ref([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const nextPageUrl = ref(null);
  const totalItems = ref(0);

  const hasMore = computed(() => Boolean(nextPageUrl.value));

  const transformApiData = (apiData) =>
    apiData.map((item) => ({
      id: item.id,
      org: item.name || "未命名單位",
      address: item.address || "地址未提供",
      phone: item.phone || "",
      contact: item.contact || "",
      status: item.status || "active",
      needed_people: item.needed_people || 1,
      notes: item.notes || "",
      lng: item.lng || 0,
      lat: item.lat || 0,
      map_link: item.map_link || "",
      created_at: item.created_at || Math.floor(Date.now() / 1000),
      time: item.time || 0,
      items: item.supplies
        ? item.supplies
            .filter((supply) => supply != null)
            .map((supply) => ({
              id: supply.id || "",
              name: supply.name || "未命名物資",
              type: supply.tag || "其他",
              need: supply.total_count || 1,
              got: supply.recieved_count || 0,
              unit: supply.unit || "個",
            }))
        : [],
    }));

  const parseApiResponse = (data) => {
    if (!data) {
      return {
        items: [],
        next: null,
        previous: null,
        totalItems: 0,
        limit: 0,
        offset: 0,
      };
    }
    if (data["@type"] === "Collection" && Array.isArray(data.member)) {
      return {
        items: transformApiData(data.member),
        next: data.next ?? null,
        previous: data.previous ?? null,
        totalItems: data.totalItems ?? data.member.length ?? 0,
        limit: data.limit ?? 0,
        offset: data.offset ?? 0,
      };
    }
    if (Array.isArray(data)) {
      return {
        items: transformApiData(data),
        next: null,
        previous: null,
        totalItems: data.length,
        limit: data.length,
        offset: 0,
      };
    }
    return {
      items: transformApiData([data]),
      next: null,
      previous: null,
      totalItems: 1,
      limit: 1,
      offset: 0,
    };
  };

  const normalizeNextUrl = (url) => {
    if (!url) return null;
    return /^https?:/i.test(url) ? url : `${API_BASE_URL}${url}`;
  };

  const fetchRequests = async ({ append = false } = {}) => {
    if (loading.value || loadingMore.value) return;

    const baseUrl = `${API_BASE_URL}/supplies?embed=all&limit=50&offset=0`;
    const targetUrl = append ? normalizeNextUrl(nextPageUrl.value) : baseUrl;

    if (!targetUrl) return;

    if (append) {
      loadingMore.value = true;
    } else {
      loading.value = true;
    }

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const parsed = parseApiResponse(data);
      const mergedItems = append
        ? [...requests.value, ...parsed.items]
        : parsed.items;
      const deduped = [];
      const seen = new Set();
      mergedItems.forEach((item) => {
        if (!item?.id || !seen.has(item.id)) {
          if (item?.id) seen.add(item.id);
          deduped.push(item);
        }
      });
      requests.value = deduped;
      nextPageUrl.value = normalizeNextUrl(parsed.next);
      totalItems.value = Math.max(
        parsed.totalItems ?? deduped.length,
        deduped.length
      );
    } catch (error) {
      const message = append ? "無法載入更多資料" : "無法載入需求資料";
      ElMessage.error(`${message}: ${error.message}`);
    } finally {
      if (append) {
        loadingMore.value = false;
      } else {
        loading.value = false;
      }
    }
  };

  return {
    requests,
    loading,
    loadingMore,
    hasMore,
    totalItems,
    fetchRequests,
  };
}

